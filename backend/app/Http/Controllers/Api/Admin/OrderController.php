<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
$validated = $request->validate([
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    Order::STATUS_PENDING,
                    Order::STATUS_CONFIRMED,
                    Order::STATUS_IN_PROGRESS,
                    Order::STATUS_COMPLETED,
                    Order::STATUS_CANCELLED,
                ]),
            ],

            'payment_status' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],

            'service_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
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

        $orders = Order::query()
            ->with([
                'user:id,name,email,phone,role',
                'cooler',
                'service',
                'address',
                'payments',
                'invoices',
            ])
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) =>
                    $query->where('status', $status)
            )
            ->when(
                $validated['payment_status'] ?? null,
                fn ($query, $paymentStatus) =>
                    $query->where('payment_status', $paymentStatus)
            )
            ->when(
                $validated['service_code'] ?? null,
                fn ($query, $serviceCode) =>
                    $query->where('service_code', $serviceCode)
            )
            ->when(
                $validated['user_id'] ?? null,
                fn ($query, $userId) =>
                    $query->where('user_id', $userId)
            )
            ->when(
                $validated['search'] ?? null,
                function ($query, $search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('order_number', 'like', "%{$search}%")
                            ->orWhere('service_name', 'like', "%{$search}%");
                    });
                }
            )
            ->latest('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
            ],
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
$order->load([
            'user:id,name,email,phone,role',
            'cooler',
            'service',
            'address',
            'statusHistory',
            'payments',
            'invoices',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'order' => $order,
            ],
        ]);
    }
}
