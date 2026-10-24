<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\Subscription;
use App\Services\Notifications\AdminPaymentNotificationService;
use App\Services\Notifications\NotificationService;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class PaymentWebhookController extends Controller
{
    /**
     * Reconcile a customer redirect with the provider, never with callback query status.
     * The intent's immutable description links the final Moyasar payment to our row.
     */
    public function confirmCustomerReturn(
        Request $request,
        int $order,
        PaymentGatewayManager $gatewayManager
    ): JsonResponse {
        $validated = $request->validate([
            'provider_payment_id' => ['required', 'string', 'uuid'],
        ]);

        $orderModel = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($order);

        $providerResult = $gatewayManager->driver('moyasar')
            ->verifyPayment($validated['provider_payment_id']);

        $result = DB::transaction(function () use (
            $orderModel,
            $validated,
            $providerResult
        ) {
            $providerPaymentId = $validated['provider_payment_id'];
            $description = $providerResult['description'] ?? null;

            $candidate = Payment::query()
                ->where('order_id', $orderModel->id)
                ->where('provider', 'moyasar')
                ->whereIn('status', [
                    Payment::STATUS_PROCESSING,
                    Payment::STATUS_PENDING,
                    Payment::STATUS_PAID,
                ])
                ->get()
                ->first(fn (Payment $row) =>
                    $description === 'NUMAYR Payment #' . $row->id
                );

            if (! $candidate) {
                abort(422, 'Payment does not belong to this order.');
            }

            $paymentModel = Payment::query()
                ->lockForUpdate()
                ->findOrFail($candidate->id);

            $expectedHalalas = (int) round(((float) $paymentModel->amount) * 100);
            if (
                (int) ($providerResult['amount'] ?? -1) !== $expectedHalalas
                || strtoupper((string) ($providerResult['currency'] ?? ''))
                    !== strtoupper((string) $paymentModel->currency)
            ) {
                abort(422, 'Verified payment amount or currency does not match.');
            }

            if ($paymentModel->status === Payment::STATUS_PAID) {
                if ($paymentModel->transaction_id !== $providerPaymentId) {
                    abort(422, 'Payment was already settled with another transaction.');
                }
                return ['payment' => $paymentModel, 'transitioned' => false];
            }

            $verifiedStatus = $providerResult['status'];
            if (! in_array($verifiedStatus, [
                Payment::STATUS_PAID,
                Payment::STATUS_FAILED,
            ], true)) {
                return ['payment' => $paymentModel, 'transitioned' => false];
            }

            if (! $paymentModel->canTransitionTo($verifiedStatus)) {
                abort(422, 'Invalid payment transition.');
            }

            if ($verifiedStatus === Payment::STATUS_FAILED) {
                $paymentModel->update([
                    'status' => Payment::STATUS_FAILED,
                    'transaction_id' => $providerPaymentId,
                    'failed_at' => now(),
                ]);
                $this->syncOrderPaymentStatus(
                    Order::query()->lockForUpdate()->findOrFail($orderModel->id)
                );
                return ['payment' => $paymentModel, 'transitioned' => true];
            }

            // The provider intent reference stays in provider_reference;
            // the settled payment UUID is stored separately for reconciliation.
            $updates = [
                'status' => Payment::STATUS_PAID,
                'transaction_id' => $providerPaymentId,
            ];
            $this->prepareOrderPaymentTransition(
                $paymentModel,
                Payment::STATUS_PAID,
                [
                    'transaction_id' => $providerPaymentId,
                    'amount' => $providerResult['amount'],
                    'currency' => $providerResult['currency'],
                ],
                $paymentModel->provider_reference,
                $updates
            );
            $paymentModel->update($updates);
            $this->syncOrderPaymentStatus(
                Order::query()->lockForUpdate()->findOrFail($orderModel->id)
            );

            return ['payment' => $paymentModel, 'transitioned' => true];
        });

        $payment = $result['payment'];
        if ($result['transitioned']) {
            $this->sendStatusNotificationSafely(
                $payment->fresh(),
                $payment->status
            );
        }

        return response()->json([
            'success' => true,
            'data' => [
                'payment_id' => $payment->id,
                'status' => $payment->fresh()->status,
                'order_id' => $orderModel->id,
            ],
        ]);
    }

    public function handle(
        Request $request,
        string $provider,
        PaymentGatewayManager $gatewayManager
    ): JsonResponse {
        $rawPayload = $request->getContent();

        $decodedPayload = json_decode($rawPayload, true);

        $payload = is_array($decodedPayload)
            ? $decodedPayload
            : ['raw' => $rawPayload];

        $payloadHash = hash('sha256', $rawPayload);

        $providerEventId = $request->header('X-Webhook-Id')
            ?? ($payload['event_id'] ?? null);

        $providerEventId = is_string($providerEventId)
            && trim($providerEventId) !== ''
                ? trim($providerEventId)
                : null;

        $idempotencyKey = $providerEventId
            ? 'event:'.$providerEventId
            : 'hash:'.$payloadHash;

        // Never persist the provider's webhook credential in the event log.
        $storedPayload = $payload;
        unset($storedPayload['secret_token']);

        $event = $this->findOrCreateWebhookEvent(
            provider: $provider,
            eventId: $providerEventId,
            idempotencyKey: $idempotencyKey,
            payloadHash: $payloadHash,
            payload: $storedPayload
        );

        try {
            $gateway = $gatewayManager->driver($provider);

            $signature = $request->header(
                'X-Payment-Signature'
            );

            if (! $gateway->verifyWebhookSignature(
                $rawPayload,
                $signature
            )) {
                if (! $event->wasRecentlyCreated) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid webhook signature',
                    ], 401);
                }
                $event->update([
                    'processing_status' => PaymentWebhookEvent::STATUS_FAILED,
                    'error_message' => 'Invalid webhook signature',
                    'processed_at' => now(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid webhook signature',
                ], 401);
            }

            // Replays must also authenticate; a matching event ID is not proof.
            if (! $event->wasRecentlyCreated) {
                return response()->json([
                    'success' => true,
                    'duplicate' => true,
                    'message' => 'Webhook already received',
                    'data' => [
                        'event_id' => $event->id,
                        'processing_status' => $event->processing_status,
                    ],
                ]);
            }

            $parsedEvent = $gateway->parseWebhook($payload);

            if ($provider === 'moyasar') {
                // Webhook data.id is the settled payment UUID, not the intent ID
                // stored in provider_reference. Verify it using our server key.
                $paymentId = $parsedEvent['reference'] ?? null;
                $verified = is_string($paymentId)
                    ? $gateway->verifyPayment($paymentId)
                    : null;

                $description = $verified['description'] ?? null;
                $candidateId = is_string($description)
                    && preg_match('/^NUMAYR Payment #([1-9][0-9]*)$/', $description, $matches)
                    ? (int) $matches[1]
                    : null;
                $candidate = $candidateId
                    ? Payment::query()->where('provider', 'moyasar')->find($candidateId)
                    : null;

                if (! $candidate
                    || $candidate->provider_reference === null
                    || (int) ($verified['amount'] ?? -1)
                        !== (int) round(((float) $candidate->amount) * 100)
                    || strtoupper((string) ($verified['currency'] ?? ''))
                        !== strtoupper((string) $candidate->currency)
                    || ($verified['status'] ?? null) !== ($parsedEvent['status'] ?? null)
                ) {
                    $event->update([
                        'processing_status' => PaymentWebhookEvent::STATUS_IGNORED,
                        'error_message' => 'Moyasar payment verification mismatch',
                        'processed_at' => now(),
                    ]);
                    return response()->json([
                        'success' => true,
                        'message' => 'Webhook ignored after provider verification',
                    ]);
                }

                $parsedEvent['reference'] = $candidate->provider_reference;
                $parsedEvent['transaction_id'] = $paymentId;
                $parsedEvent['amount'] = $verified['amount'];
                $parsedEvent['currency'] = $verified['currency'];
            }

            $reference = $parsedEvent['reference'] ?? null;
            $status = $parsedEvent['status'] ?? null;

            if (! $reference || ! $status) {
                $event->update([
                    'processing_status' => PaymentWebhookEvent::STATUS_FAILED,
                    'error_message' => 'Invalid webhook payload',
                    'processed_at' => now(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid webhook payload',
                ], 422);
            }

            $event->update([
                'provider_reference' => $reference,
                'event_status' => $status,
            ]);

            $result = DB::transaction(function () use (
                $provider,
                $reference,
                $status,
                $parsedEvent,
                $event
            ) {
                $paymentModel = Payment::query()
                    ->where('provider', $provider)
                    ->where('provider_reference', $reference)
                    ->lockForUpdate()
                    ->first();

                if (! $paymentModel) {
                    $event->update([
                        'processing_status' => PaymentWebhookEvent::STATUS_IGNORED,
                        'error_message' => 'Payment not found',
                        'processed_at' => now(),
                    ]);

                    return [
                        'payment' => null,
                        'transitioned' => false,
                    ];
                }

                $event->update([
                    'payment_id' => $paymentModel->id,
                ]);

                $hasOrderTarget =
                    $paymentModel->order_id !== null;

                $hasSubscriptionTarget =
                    $paymentModel->subscription_id !== null;

                if ($hasOrderTarget === $hasSubscriptionTarget) {
                    $event->update([
                        'processing_status' => PaymentWebhookEvent::STATUS_IGNORED,
                        'error_message' => $hasOrderTarget
                            ? 'Payment cannot target both order and subscription'
                            : 'Payment has no order or subscription',
                        'processed_at' => now(),
                    ]);

                    return [
                        'payment' => $paymentModel,
                        'transitioned' => false,
                    ];
                }

                if ($paymentModel->status === $status) {
                    $event->update([
                        'processing_status' => PaymentWebhookEvent::STATUS_PROCESSED,
                        'processed_at' => now(),
                    ]);

                    return [
                        'payment' => $paymentModel,
                        'transitioned' => false,
                    ];
                }

                if (! $paymentModel->canTransitionTo($status)) {
                    $event->update([
                        'processing_status' => PaymentWebhookEvent::STATUS_IGNORED,
                        'error_message' => sprintf(
                            'Transition from %s to %s is not allowed',
                            $paymentModel->status,
                            $status
                        ),
                        'processed_at' => now(),
                    ]);

                    return [
                        'payment' => $paymentModel,
                        'transitioned' => false,
                    ];
                }

                $updateData = [
                    'status' => $status,
                ];

                if (! empty($parsedEvent['transaction_id'])) {
                    $updateData['transaction_id'] =
                        $parsedEvent['transaction_id'];
                }

                if ($hasOrderTarget) {
                    $this->prepareOrderPaymentTransition(
                        $paymentModel,
                        $status,
                        $parsedEvent,
                        $reference,
                        $updateData
                    );
                } else {
                    $this->handleSubscriptionPayment(
                        $paymentModel,
                        $status,
                        $updateData
                    );
                }

                $paymentModel->update($updateData);

                if ($hasOrderTarget) {
                    $orderModel = Order::query()
                        ->lockForUpdate()
                        ->findOrFail($paymentModel->order_id);

                    $this->syncOrderPaymentStatus($orderModel);
                }

                $event->update([
                    'processing_status' => PaymentWebhookEvent::STATUS_PROCESSED,
                    'error_message' => null,
                    'processed_at' => now(),
                ]);

                return [
                    'payment' => $paymentModel,
                    'transitioned' => true,
                ];
            });

            $payment = $result['payment'];

            if (! $payment) {
                return response()->json([
                    'success' => true,
                    'message' => 'Webhook ignored',
                    'data' => [
                        'event_id' => $event->id,
                        'processing_status' => $event->processing_status,
                    ],
                ]);
            }

            if ($result['transitioned']) {
                $this->sendStatusNotificationSafely(
                    $payment->fresh(),
                    $status
                );
            }

            return response()->json([
                'success' => true,
                'duplicate' => false,
                'data' => [
                    'event_id' => $event->id,
                    'payment_id' => $payment->id,
                    'status' => $payment->status,
                    'processing_status' => $event->fresh()->processing_status,
                ],
            ]);
        } catch (Throwable $exception) {
            $event->update([
                'processing_status' => PaymentWebhookEvent::STATUS_FAILED,
                'error_message' => $exception->getMessage(),
                'processed_at' => now(),
            ]);

            throw $exception;
        }
    }

    private function findOrCreateWebhookEvent(
        string $provider,
        ?string $eventId,
        string $idempotencyKey,
        string $payloadHash,
        array $payload
    ): PaymentWebhookEvent {
        $existing = PaymentWebhookEvent::query()
            ->where('provider', $provider)
            ->where('idempotency_key', $idempotencyKey)
            ->first();

        if ($existing) {
            return $existing;
        }

        try {
            return PaymentWebhookEvent::create([
                'provider' => $provider,
                'event_id' => $eventId,
                'idempotency_key' => $idempotencyKey,
                'payload_hash' => $payloadHash,
                'provider_reference' => $payload['reference'] ?? null,
                'event_status' => $payload['status'] ?? null,
                'payload' => $payload,
                'processing_status' => PaymentWebhookEvent::STATUS_RECEIVED,
            ]);
        } catch (QueryException $exception) {
            $duplicate = PaymentWebhookEvent::query()
                ->where('provider', $provider)
                ->where('idempotency_key', $idempotencyKey)
                ->first();

            if ($duplicate) {
                return $duplicate;
            }

            throw $exception;
        }
    }

    private function prepareOrderPaymentTransition(
        Payment $payment,
        string $status,
        array $parsedEvent,
        string $reference,
        array &$updateData
    ): void {
        $orderModel = Order::query()
            ->lockForUpdate()
            ->findOrFail($payment->order_id);

        if ($status === Payment::STATUS_PAID) {
            $updateData['paid_at'] = now();
            $updateData['failed_at'] = null;
            $updateData['failure_reason'] = null;

            Invoice::firstOrCreate(
                [
                    'order_id' => $orderModel->id,
                    'payment_id' => $payment->id,
                ],
                [
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'user_id' => $orderModel->user_id,
                    'status' => Invoice::STATUS_PAID,
                    'customer_name' => $orderModel->user?->name,
                    'customer_email' => $orderModel->user?->email,
                    'customer_phone' => $orderModel->user?->phone,
                    'service_code' => $orderModel->service_code,
                    'service_name' => $orderModel->service_name,
                    'subtotal' => $orderModel->subtotal,
                    'tax_rate' => $orderModel->tax_rate,
                    'tax_amount' => $orderModel->tax_amount,
                    'total_amount' => $orderModel->total_amount,
                    'currency' => $orderModel->currency,
                    'address_snapshot' => $orderModel->address_snapshot,
                    'service_data' => $orderModel->service_data,
                    'metadata' => [
                        'order_number' => $orderModel->order_number,
                        'transaction_id' => $parsedEvent['transaction_id']
                                ?? null,
                        'provider_reference' => $reference,
                    ],
                    'issued_at' => now(),
                    'paid_at' => now(),
                ]
            );
        }

        if ($status === Payment::STATUS_FAILED) {
            $updateData['failed_at'] = now();
        }

        if ($status === Payment::STATUS_REFUNDED) {
            $updateData['refunded_at'] = now();

            Invoice::query()
                ->where('payment_id', $payment->id)
                ->update([
                    'status' => Invoice::STATUS_REFUNDED,
                ]);
        }
    }

    private function handleSubscriptionPayment(
        Payment $payment,
        string $status,
        array &$updateData
    ): void {
        $subscription = Subscription::query()
            ->lockForUpdate()
            ->findOrFail($payment->subscription_id);

        if ($status === Payment::STATUS_PAID) {
            $paidAt = now();

            $updateData['paid_at'] = $paidAt;
            $updateData['failed_at'] = null;
            $updateData['failure_reason'] = null;

            if (
                $subscription->status ===
                Subscription::STATUS_CANCELLED
            ) {
                $updateData['metadata'] = array_merge(
                    $payment->metadata ?? [],
                    [
                        'subscription_activation_skipped' => true,
                        'subscription_activation_skip_reason' => 'subscription_cancelled_before_payment_confirmation',
                    ]
                );

                return;
            }

            $start = $paidAt->copy();

            $end = $subscription->billing_cycle === 'yearly'
                ? $start->copy()->addYearNoOverflow()
                : $start->copy()->addMonthNoOverflow();

            $subscription->update([
                'status' => Subscription::STATUS_ACTIVE,
                'starts_at' => $start,
                'ends_at' => $end,
                'cancelled_at' => null,
            ]);

            return;
        }

        if ($status === Payment::STATUS_FAILED) {
            $updateData['failed_at'] = now();

            if (
                $subscription->status !==
                Subscription::STATUS_CANCELLED
            ) {
                $subscription->update([
                    'status' => Subscription::STATUS_CANCELLED,
                    'cancelled_at' => now(),
                ]);
            }

            return;
        }

        if ($status === Payment::STATUS_REFUNDED) {
            $updateData['refunded_at'] = now();

            $subscription->update([
                'status' => Subscription::STATUS_CANCELLED,
                'cancelled_at' => $subscription->cancelled_at ?? now(),
            ]);
        }
    }

    private function syncOrderPaymentStatus(
        Order $order
    ): void {
        $statuses = $order->payments()
            ->pluck('status');

        if ($statuses->contains(Payment::STATUS_PAID)) {
            $status = Payment::STATUS_PAID;
        } elseif (
            $statuses->contains(Payment::STATUS_PROCESSING)
        ) {
            $status = Payment::STATUS_PROCESSING;
        } elseif (
            $statuses->contains(Payment::STATUS_PENDING)
        ) {
            $status = Payment::STATUS_PENDING;
        } elseif (
            $statuses->contains(Payment::STATUS_REFUNDED)
        ) {
            $status = Payment::STATUS_REFUNDED;
        } else {
            $status = Payment::STATUS_FAILED;
        }

        if ($order->payment_status !== $status) {
            $order->update([
                'payment_status' => $status,
            ]);
        }
    }

    private function sendStatusNotificationSafely(
        Payment $payment,
        string $status
    ): void {
        try {
            app(AdminPaymentNotificationService::class)
                ->notify($payment, $status);
        } catch (Throwable $exception) {
            report($exception);
        }

        try {
            if ($payment->order_id !== null) {
                $this->sendOrderPaymentNotification(
                    $payment,
                    $status
                );

                return;
            }

            if ($payment->subscription_id !== null) {
                $this->sendSubscriptionPaymentNotification(
                    $payment,
                    $status
                );
            }
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    private function sendOrderPaymentNotification(
        Payment $payment,
        string $status
    ): void {
        $messages = [
            Payment::STATUS_PAID => [
                'title' => 'تم الدفع بنجاح',
                'body' => 'تم استلام دفعة طلبك بنجاح',
            ],
            Payment::STATUS_FAILED => [
                'title' => 'تعذر إتمام الدفع',
                'body' => 'لم تكتمل عملية دفع طلبك',
            ],
            Payment::STATUS_REFUNDED => [
                'title' => 'تم استرداد المبلغ',
                'body' => 'تم تحديث دفعة طلبك إلى مستردة',
            ],
        ];

        if (! isset($messages[$status])) {
            return;
        }

        $order = Order::query()
            ->find($payment->order_id);

        if (! $order) {
            return;
        }

        if (
            $status === Payment::STATUS_FAILED
            && $order->payment_status === Payment::STATUS_PAID
        ) {
            return;
        }

        app(NotificationService::class)->sendInApp(
            userId: $order->user_id,
            type: 'payment',
            title: $messages[$status]['title'],
            body: $messages[$status]['body'],
            data: [
                'payment_id' => $payment->id,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $status,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
            ]
        );
    }

    private function sendSubscriptionPaymentNotification(
        Payment $payment,
        string $status
    ): void {
        $subscription = Subscription::query()
            ->find($payment->subscription_id);

        if (! $subscription) {
            return;
        }

        $activationSkipped = (bool) data_get(
            $payment->metadata,
            'subscription_activation_skipped',
            false
        );

        if ($status === Payment::STATUS_PAID) {
            if ($activationSkipped) {
                $title = 'تم استلام دفعة الاشتراك';
                $body =
                    'تم استلام الدفعة ولكن الاشتراك الملغي لم يتم تفعيله تلقائيًا';
            } else {
                $title = 'تم تفعيل اشتراكك';
                $body = 'تم تفعيل اشتراكك بنجاح';
            }
        } elseif ($status === Payment::STATUS_FAILED) {
            $title = 'تعذر إتمام دفعة الاشتراك';
            $body = 'لم تكتمل عملية دفع الاشتراك';
        } elseif ($status === Payment::STATUS_REFUNDED) {
            $title = 'تم استرداد دفعة الاشتراك';
            $body = 'تم تحديث دفعة الاشتراك إلى مستردة';
        } else {
            return;
        }

        app(NotificationService::class)->sendInApp(
            userId: $subscription->user_id,
            type: 'subscription',
            title: $title,
            body: $body,
            data: [
                'payment_id' => $payment->id,
                'subscription_id' => $subscription->id,
                'plan_code' => $subscription->plan_code,
                'payment_status' => $status,
                'subscription_status' => $subscription->status,
                'activation_skipped' => $activationSkipped,
                'amount' => $payment->amount,
                'currency' => $payment->currency,
            ]
        );
    }

    private function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-'
                .now()->format('Ymd')
                .'-'
                .strtoupper(str()->random(6));
        } while (
            Invoice::query()
                ->where('invoice_number', $number)
                ->exists()
        );

        return $number;
    }
}
