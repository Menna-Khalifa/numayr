<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class PaymentWebhookController extends Controller
{
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

        $event = PaymentWebhookEvent::firstOrCreate(
            [
                'provider' => $provider,
                'payload_hash' => $payloadHash,
            ],
            [
                'event_id' => $request->header('X-Webhook-Id')
                    ?? ($payload['event_id'] ?? null),

                'provider_reference' => $payload['reference'] ?? null,
                'event_status' => $payload['status'] ?? null,
                'payload' => $payload,
                'processing_status' => PaymentWebhookEvent::STATUS_RECEIVED,
            ]
        );

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

        try {
            $gateway = $gatewayManager->driver($provider);

            $signature = $request->header('X-Payment-Signature');

            if (! $gateway->verifyWebhookSignature(
                $rawPayload,
                $signature
            )) {
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

            $parsedEvent = $gateway->parseWebhook($payload);

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

            $payment = DB::transaction(function () use (
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

                    return null;
                }

                $event->update([
                    'payment_id' => $paymentModel->id,
                ]);

                $orderModel = Order::query()
                    ->lockForUpdate()
                    ->findOrFail($paymentModel->order_id);

                if ($paymentModel->status === $status) {
                    $event->update([
                        'processing_status' => PaymentWebhookEvent::STATUS_PROCESSED,
                        'processed_at' => now(),
                    ]);

                    return $paymentModel;
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

                    return $paymentModel;
                }

                $updateData = [
                    'status' => $status,
                ];

                if (! empty($parsedEvent['transaction_id'])) {
                    $updateData['transaction_id'] =
                        $parsedEvent['transaction_id'];
                }

                if ($status === Payment::STATUS_PROCESSING) {
                    $orderModel->update([
                        'payment_status' => Payment::STATUS_PROCESSING,
                    ]);
                }

                if ($status === Payment::STATUS_PAID) {
                    $updateData['paid_at'] = now();
                    $updateData['failed_at'] = null;
                    $updateData['failure_reason'] = null;

                    $orderModel->update([
                        'payment_status' => Payment::STATUS_PAID,
                    ]);

                    Invoice::firstOrCreate(
                        [
                            'order_id' => $orderModel->id,
                            'payment_id' => $paymentModel->id,
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
                                'transaction_id' =>
                                    $parsedEvent['transaction_id'] ?? null,
                                'provider_reference' => $reference,
                            ],

                            'issued_at' => now(),
                            'paid_at' => now(),
                        ]
                    );
                }

                if ($status === Payment::STATUS_FAILED) {
                    $updateData['failed_at'] = now();

                    $orderModel->update([
                        'payment_status' => Payment::STATUS_FAILED,
                    ]);
                }

                if ($status === Payment::STATUS_REFUNDED) {
                    $updateData['refunded_at'] = now();

                    $orderModel->update([
                        'payment_status' => Payment::STATUS_REFUNDED,
                    ]);

                    Invoice::query()
                        ->where('payment_id', $paymentModel->id)
                        ->update([
                            'status' => Invoice::STATUS_REFUNDED,
                        ]);
                }

                $paymentModel->update($updateData);

                $event->update([
                    'processing_status' => PaymentWebhookEvent::STATUS_PROCESSED,
                    'error_message' => null,
                    'processed_at' => now(),
                ]);

                return $paymentModel;
            });

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

    private function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-'
                . now()->format('Ymd')
                . '-'
                . strtoupper(str()->random(6));
        } while (
            Invoice::query()
                ->where('invoice_number', $number)
                ->exists()
        );

        return $number;
    }
}