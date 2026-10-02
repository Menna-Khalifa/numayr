<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
$validated = $request->validate([
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    Payment::STATUS_PENDING,
                    Payment::STATUS_PROCESSING,
                    Payment::STATUS_PAID,
                    Payment::STATUS_FAILED,
                    Payment::STATUS_REFUNDED,
                ]),
            ],

            'provider' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'method' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'order_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:orders,id',
            ],

            'user_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'search' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $payments = Payment::query()
            ->with([
                'order.user:id,name,email,phone,role',
                'invoice',
            ])
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) =>
                    $query->where('status', $status)
            )
            ->when(
                $validated['provider'] ?? null,
                fn ($query, $provider) =>
                    $query->where('provider', $provider)
            )
            ->when(
                $validated['method'] ?? null,
                fn ($query, $method) =>
                    $query->where('method', $method)
            )
            ->when(
                $validated['order_id'] ?? null,
                fn ($query, $orderId) =>
                    $query->where('order_id', $orderId)
            )
            ->when(
                $validated['user_id'] ?? null,
                function ($query, $userId) {
                    $query->whereHas(
                        'order',
                        fn ($orderQuery) =>
                            $orderQuery->where('user_id', $userId)
                    );
                }
            )
            ->when(
                $validated['search'] ?? null,
                function ($query, $search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('transaction_id', 'like', "%{$search}%")
                            ->orWhere('provider_reference', 'like', "%{$search}%")
                            ->orWhereHas(
                                'order',
                                function ($orderQuery) use ($search) {
                                    $orderQuery->where(
                                        'order_number',
                                        'like',
                                        "%{$search}%"
                                    );
                                }
                            );
                    });
                }
            )
            ->latest('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'payments' => $payments,
            ],
        ]);
    }

    public function show(
        Request $request,
        Payment $payment
    ): JsonResponse {
$payment->load([
            'order.user:id,name,email,phone,role',
            'order.service',
            'invoice',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'payment' => $payment,
            ],
        ]);
    }
}
