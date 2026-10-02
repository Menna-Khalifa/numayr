<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
$validated = $request->validate([
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    Invoice::STATUS_ISSUED,
                    Invoice::STATUS_PAID,
                    Invoice::STATUS_VOID,
                    Invoice::STATUS_REFUNDED,
                ]),
            ],

            'user_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'order_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:orders,id',
            ],

            'payment_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:payments,id',
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

        $invoices = Invoice::query()
            ->with([
                'user:id,name,email,phone,role',
                'order',
                'payment',
            ])
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) =>
                    $query->where('status', $status)
            )
            ->when(
                $validated['user_id'] ?? null,
                fn ($query, $userId) =>
                    $query->where('user_id', $userId)
            )
            ->when(
                $validated['order_id'] ?? null,
                fn ($query, $orderId) =>
                    $query->where('order_id', $orderId)
            )
            ->when(
                $validated['payment_id'] ?? null,
                fn ($query, $paymentId) =>
                    $query->where('payment_id', $paymentId)
            )
            ->when(
                $validated['search'] ?? null,
                function ($query, $search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('invoice_number', 'like', "%{$search}%")
                            ->orWhere('customer_name', 'like', "%{$search}%")
                            ->orWhere('customer_email', 'like', "%{$search}%")
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
                'invoices' => $invoices,
            ],
        ]);
    }

    public function show(
        Request $request,
        Invoice $invoice
    ): JsonResponse {
$invoice->load([
            'user:id,name,email,phone,role',
            'order',
            'payment',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'invoice' => $invoice,
            ],
        ]);
    }
}
