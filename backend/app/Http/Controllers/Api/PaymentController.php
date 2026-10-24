<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Notifications\AdminPaymentNotificationService;
use App\Services\Notifications\NotificationService;
use App\Services\Payments\PaymentGatewayManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;
class PaymentController extends Controller
{
    public function store(
        Request $request,
        int $order,
        PaymentGatewayManager $gatewayManager
    ): JsonResponse {
        $user = $request->user();
        $validated = $request->validate([
            'method' => [
                'required',
                'string',
                Rule::in([
                    'card',
                    'mada',
                    'apple_pay',
                ]),
            ],
        ]);
        $result = DB::transaction(function () use (
            $user,
            $order,
            $validated
        ) {
            $orderModel = Order::query()
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->findOrFail($order);
            if ($orderModel->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'order' => [
                        'لا يمكن الدفع لطلب ملغي',
                    ],
                ]);
            }
            if (! $orderModel->isPaymentAllowed()) {
                throw ValidationException::withMessages([
                    'payment' => [
                        'لا يمكن الدفع لهذا الطلب قبل اعتماد السعر والموافقة عليه',
                    ],
                ]);
            }
            $hasPaidPayment = $orderModel->payments()
                ->where('status', Payment::STATUS_PAID)
                ->exists();
            if ($hasPaidPayment) {
                if (
                    $orderModel->payment_status !==
                    Payment::STATUS_PAID
                ) {
                    $orderModel->update([
                        'payment_status' => Payment::STATUS_PAID,
                    ]);
                }
                throw ValidationException::withMessages([
                    'payment' => [
                        'تم دفع هذا الطلب بالفعل',
                    ],
                ]);
            }
            $existingPayment = $orderModel->payments()
                ->whereIn('status', [
                    Payment::STATUS_PENDING,
                    Payment::STATUS_PROCESSING,
                ])
                ->latest()
                ->first();
            if ($existingPayment) {
                return [
                    'payment' => $existingPayment,
                    'created' => false,
                ];
            }
            $payment = $orderModel->payments()->create([
                'provider' => null,
                'method' => $validated['method'],
                'status' => Payment::STATUS_PENDING,
                'amount' => $orderModel->total_amount,
                'currency' => $orderModel->currency,
                'metadata' => [
                    'order_number' => $orderModel->order_number,
                ],
            ]);
            $this->syncOrderPaymentStatus($orderModel);
            return [
                'payment' => $payment,
                'created' => true,
            ];
        });
        $payment = $result['payment'];
        if (
            ! $result['created']
            && $payment->provider_reference
        ) {
            $payment->load('order');
            return response()->json([
                'success' => true,
                'message' => 'توجد محاولة دفع نشطة بالفعل',
                'data' => [
                    'payment' => new PaymentResource($payment),
                ],
            ]);
        }
        $provider = config('payments.default');
        if (! is_string($provider) || $provider === '') {
            throw new RuntimeException(
                'Payment provider is not configured.'
            );
        }
        try {
            $gateway = $gatewayManager->driver($provider);
            $gatewayResult = $gateway->createPayment($payment);
        } catch (Throwable $exception) {
            DB::transaction(function () use (
                $payment,
                $exception
            ) {
                $paymentModel = Payment::query()
                    ->lockForUpdate()
                    ->findOrFail($payment->id);
                $orderModel = Order::query()
                    ->lockForUpdate()
                    ->findOrFail($paymentModel->order_id);
                $paymentModel->update([
                    'status' => Payment::STATUS_FAILED,
                    'failed_at' => now(),
                    'failure_reason' => $exception->getMessage(),
                ]);
                $this->syncOrderPaymentStatus($orderModel);
            });
            throw $exception;
        }
        $payment = DB::transaction(function () use (
            $payment,
            $provider,
            $gatewayResult
        ) {
            $paymentModel = Payment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);
            $orderModel = Order::query()
                ->lockForUpdate()
                ->findOrFail($paymentModel->order_id);
            $gatewayStatus = $gatewayResult['status']
                ?? Payment::STATUS_PROCESSING;
            if (! in_array($gatewayStatus, [
                Payment::STATUS_PENDING,
                Payment::STATUS_PROCESSING,
            ], true)) {
                $gatewayStatus = Payment::STATUS_PROCESSING;
            }
            $metadata = $paymentModel->metadata ?? [];
            if (array_key_exists('checkout_url', $gatewayResult)) {
                $metadata['checkout_url'] =
                    $gatewayResult['checkout_url'];
            }
            $paymentModel->update([
                'provider' => $provider,
                'provider_reference' => $gatewayResult['reference'] ?? null,
                'status' => $gatewayStatus,
                'metadata' => $metadata,
            ]);
            $this->syncOrderPaymentStatus($orderModel);
            return $paymentModel;
        });
        $payment->load('order');
        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء محاولة الدفع بنجاح',
            'data' => [
                'payment' => new PaymentResource($payment),
                // Payment-intent credential: returned only to the owner on creation.
                // Never persist or expose it in payment listings or logs.
                'checkout' => $provider === 'moyasar' ? [
                    'intent_id' => $gatewayResult['reference'] ?? null,
                    'client_secret' => $gatewayResult['client_secret'] ?? null,
                    'expires_at' => $gatewayResult['expires_at'] ?? null,
                    'publishable_key' => config('services.moyasar.publishable_key'),
                    'callback_url' => config('services.moyasar.callback_url'),
                ] : null,
            ],
        ], $result['created'] ? 201 : 200);
    }
    /**
     * Close only an unused Moyasar intent. Fulfilled or uncertain intents
     * remain locked for reconciliation instead of risking a second charge.
     */
    public function abandonUnused(Request $request, int $order, int $payment): JsonResponse
    {
        $paymentModel = Payment::query()
            ->where('order_id', $order)
            ->whereHas('order', fn ($query) => $query->where('user_id', $request->user()->id))
            ->findOrFail($payment);

        if ($paymentModel->provider !== 'moyasar'
            || ! in_array($paymentModel->status, [Payment::STATUS_PENDING, Payment::STATUS_PROCESSING], true)
            || ! is_string($paymentModel->provider_reference)
            || $paymentModel->provider_reference === '') {
            throw ValidationException::withMessages([
                'payment' => ['محاولة الدفع لا تقبل الإلغاء الآمن'],
            ]);
        }

        // Provider confirmation must precede any local state change.
        if (! app(\\App\\Services\\Payments\\Gateways\\MoyasarGateway::class)
            ->cancelUnusedIntent($paymentModel->provider_reference)) {
            throw ValidationException::withMessages([
                'payment' => ['تعذر التأكد من عدم تنفيذ الدفع، يُرجى مراجعة حالته قبل المحاولة مرة أخرى'],
            ]);
        }

        DB::transaction(function () use ($paymentModel) {
            $locked = Payment::query()->lockForUpdate()->findOrFail($paymentModel->id);
            $orderModel = Order::query()->lockForUpdate()->findOrFail($locked->order_id);
            if (in_array($locked->status, [Payment::STATUS_PENDING, Payment::STATUS_PROCESSING], true)) {
                $locked->update([
                    'status' => Payment::STATUS_FAILED,
                    'failed_at' => now(),
                    'failure_reason' => 'Unused Moyasar intent canceled or expired before retry',
                ]);
                $this->syncOrderPaymentStatus($orderModel);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إغلاق محاولة الدفع غير المكتملة، يمكنك إعادة المحاولة',
            'data' => ['payment_id' => $paymentModel->id],
        ]);
    }

    public function index(
        Request $request,
        int $order
    ): JsonResponse {
        $orderModel = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($order);
        $payments = $orderModel->payments()
            ->latest()
            ->get();
        return response()->json([
            'success' => true,
            'data' => [
                'payments' => PaymentResource::collection($payments),
            ],
        ]);
    }
    public function show(
        Request $request,
        int $order,
        int $payment
    ): JsonResponse {
        $orderModel = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($order);
        $paymentModel = $orderModel->payments()
            ->findOrFail($payment);
        return response()->json([
            'success' => true,
            'data' => [
                'payment' => new PaymentResource($paymentModel),
            ],
        ]);
    }
    public function transition(
        Request $request,
        int $order,
        int $payment
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                Rule::in([
                    Payment::STATUS_PROCESSING,
                    Payment::STATUS_PAID,
                    Payment::STATUS_FAILED,
                    Payment::STATUS_REFUNDED,
                ]),
            ],
            'transaction_id' => [
                'nullable',
                'string',
                'max:150',
            ],
            'provider_reference' => [
                'nullable',
                'string',
                'max:150',
            ],
            'failure_reason' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);
        $result = DB::transaction(function () use (
            $order,
            $payment,
            $validated
        ) {
            $orderModel = Order::query()
                ->lockForUpdate()
                ->findOrFail($order);
            $paymentModel = Payment::query()
                ->where('order_id', $orderModel->id)
                ->lockForUpdate()
                ->findOrFail($payment);
            if ($paymentModel->provider !== 'fake') {
                throw ValidationException::withMessages([
                    'payment' => [
                        'لا يمكن تغيير حالة مدفوعات بوابة الدفع الإلكترونية يدويًا',
                    ],
                ]);
            }
            $newStatus = $validated['status'];
            if (! $paymentModel->canTransitionTo($newStatus)) {
                throw ValidationException::withMessages([
                    'status' => [
                        'الانتقال إلى حالة الدفع المطلوبة غير مسموح',
                    ],
                ]);
            }
            $updateData = [
                'status' => $newStatus,
            ];
            if (! empty($validated['transaction_id'])) {
                $updateData['transaction_id'] =
                    $validated['transaction_id'];
            }
            if (! empty($validated['provider_reference'])) {
                $updateData['provider_reference'] =
                    $validated['provider_reference'];
            }
            if ($newStatus === Payment::STATUS_PAID) {
                $updateData['paid_at'] = now();
                $updateData['failed_at'] = null;
                $updateData['failure_reason'] = null;
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
                            'transaction_id' => $validated['transaction_id']
                                    ?? null,
                            'provider_reference' => $validated['provider_reference']
                                    ?? null,
                        ],
                        'issued_at' => now(),
                        'paid_at' => now(),
                    ]
                );
            }
            if ($newStatus === Payment::STATUS_FAILED) {
                $updateData['failed_at'] = now();
                $updateData['failure_reason'] =
                    $validated['failure_reason'] ?? null;
            }
            if ($newStatus === Payment::STATUS_REFUNDED) {
                $updateData['refunded_at'] = now();
                Invoice::query()
                    ->where('payment_id', $paymentModel->id)
                    ->update([
                        'status' => Invoice::STATUS_REFUNDED,
                    ]);
            }
            $paymentModel->update($updateData);
            $this->syncOrderPaymentStatus($orderModel);
            return [
                'payment' => $paymentModel,
                'status' => $newStatus,
            ];
        });
        $paymentModel = $result['payment'];

        try {
            app(AdminPaymentNotificationService::class)
                ->notify($paymentModel->fresh(), $result['status']);
        } catch (\Throwable $exception) {
            report($exception);
        }

        $this->sendOrderPaymentNotification(
            $paymentModel->fresh(),
            $result['status']
        );
        $paymentModel->load('order');
        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الدفع بنجاح',
            'data' => [
                'payment' => $paymentModel,
            ],
        ]);
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
    private function generateInvoiceNumber(): string
    {
        do {
            $number = 'INV-'
                .now()->format('Ymd')
                .'-'
                .strtoupper(Str::random(6));
        } while (
            Invoice::query()
                ->where('invoice_number', $number)
                ->exists()
        );
        return $number;
    }
}
