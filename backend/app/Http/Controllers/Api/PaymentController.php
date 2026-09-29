<?php

namespace App\Http\Controllers\Api;
use App\Models\Invoice;
use Illuminate\Support\Str;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Services\Payments\PaymentGatewayManager;
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

        if ($orderModel->payment_status === Payment::STATUS_PAID) {
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

        $orderModel->update([
            'payment_status' => Payment::STATUS_PENDING,
        ]);

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
                'payment' => $payment,
            ],
        ]);
    }

    $provider = (string) config('payments.default', 'fake');

    try {
        $gateway = $gatewayManager->driver($provider);

        $gatewayResult = $gateway->createPayment($payment);
    } catch (Throwable $exception) {
        DB::transaction(function () use ($payment, $exception) {
            $paymentModel = Payment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            $paymentModel->update([
                'status' => Payment::STATUS_FAILED,
                'failed_at' => now(),
                'failure_reason' => $exception->getMessage(),
            ]);

            $paymentModel->order()->update([
                'payment_status' => Payment::STATUS_FAILED,
            ]);
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
            $metadata['checkout_url'] = $gatewayResult['checkout_url'];
        }

        $paymentModel->update([
            'provider' => $provider,
            'provider_reference' => $gatewayResult['reference'] ?? null,
            'status' => $gatewayStatus,
            'metadata' => $metadata,
        ]);

        $orderModel->update([
            'payment_status' => $gatewayStatus,
        ]);

        return $paymentModel;
    });

    $payment->load('order');

    return response()->json([
        'success' => true,
        'message' => 'تم إنشاء محاولة الدفع بنجاح',
        'data' => [
            'payment' => $payment,
        ],
    ], $result['created'] ? 201 : 200);
}
    public function index(Request $request, int $order): JsonResponse
    {
        $orderModel = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($order);

        $payments = $orderModel->payments()
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'payments' => $payments,
            ],
        ]);
    }

    public function show(Request $request, int $order, int $payment): JsonResponse
    {
        $orderModel = Order::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($order);

        $paymentModel = $orderModel->payments()
            ->findOrFail($payment);

        return response()->json([
            'success' => true,
            'data' => [
                'payment' => $paymentModel,
            ],
        ]);
    }
    public function transition(Request $request, int $order, int $payment): JsonResponse
{
    $user = $request->user();

    if ($user->role !== 'admin') {
        abort(403, 'غير مصرح لك بتحديث حالة الدفع');
    }

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

    $paymentModel = DB::transaction(function () use (
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
            $updateData['transaction_id'] = $validated['transaction_id'];
        }

        if (! empty($validated['provider_reference'])) {
            $updateData['provider_reference'] = $validated['provider_reference'];
        }

        if ($newStatus === Payment::STATUS_PAID) {
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
            'transaction_id' => $validated['transaction_id'] ?? null,
            'provider_reference' => $validated['provider_reference'] ?? null,
        ],

        'issued_at' => now(),
        'paid_at' => now(),
    ]
);
        }

        if ($newStatus === Payment::STATUS_FAILED) {
            $updateData['failed_at'] = now();
            $updateData['failure_reason'] = $validated['failure_reason'] ?? null;

            $orderModel->update([
                'payment_status' => Payment::STATUS_FAILED,
            ]);
        }

        if ($newStatus === Payment::STATUS_PROCESSING) {
            $orderModel->update([
                'payment_status' => Payment::STATUS_PROCESSING,
            ]);
        }

        if ($newStatus === Payment::STATUS_REFUNDED) {
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

        return $paymentModel;
    });

    $paymentModel->load('order');

    return response()->json([
        'success' => true,
        'message' => 'تم تحديث حالة الدفع بنجاح',
        'data' => [
            'payment' => $paymentModel,
        ],
    ]);
}
private function generateInvoiceNumber(): string
{
    do {
        $number = 'INV-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    } while (
        Invoice::query()
            ->where('invoice_number', $number)
            ->exists()
    );

    return $number;
}
}