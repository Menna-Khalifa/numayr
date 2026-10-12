<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\Notifications\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderQuoteController extends Controller
{
    public function store(Request $request, int $order): JsonResponse
    {
        $validated = $request->validate([
            'quote_subtotal' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
                'max:9999999999.99',
            ],
            'quote_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        $orderModel = DB::transaction(function () use ($request, $order, $validated) {
            $orderModel = Order::query()
                ->lockForUpdate()
                ->findOrFail($order);

            if ($orderModel->pricing_model !== 'quote') {
                throw ValidationException::withMessages([
                    'order' => ['هذه الخدمة لا تحتاج إلى عرض سعر'],
                ]);
            }

            if ($orderModel->isFinalStatus()) {
                throw ValidationException::withMessages([
                    'order' => ['لا يمكن تسعير طلب مكتمل أو ملغي'],
                ]);
            }

            if ($orderModel->status !== Order::STATUS_PENDING) {
                throw ValidationException::withMessages([
                    'order' => ['لا يمكن تسعير الطلب في حالته الحالية'],
                ]);
            }

            if ($orderModel->payments()
                ->where('status', Payment::STATUS_PAID)
                ->exists()
            ) {
                throw ValidationException::withMessages([
                    'payment' => ['لا يمكن تعديل سعر طلب مدفوع'],
                ]);
            }

            if ($orderModel->payments()
                ->whereIn('status', [
                    Payment::STATUS_PENDING,
                    Payment::STATUS_PROCESSING,
                ])
                ->exists()
            ) {
                throw ValidationException::withMessages([
                    'payment' => ['توجد محاولة دفع نشطة لهذا الطلب'],
                ]);
            }

            $subtotal = round(
                (float) $validated['quote_subtotal']
                + (float) $orderModel->urgent_fee,
                2
            );

            $taxAmount = round(
                $subtotal * ((float) $orderModel->tax_rate / 100),
                2
            );

            $totalAmount = round($subtotal + $taxAmount, 2);

            $orderModel->update([
                'quote_status' => Order::QUOTE_STATUS_AWAITING_APPROVAL,
                'quote_subtotal' => $validated['quote_subtotal'],
                'quote_notes' => $validated['quote_notes'] ?? null,
                'quoted_by_user_id' => $request->user()->id,
                'quoted_at' => now(),
                'quote_approved_at' => null,
                'quote_rejected_at' => null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
            ]);

            return $orderModel;
        });

        app(NotificationService::class)->sendInApp(
            userId: $orderModel->user_id,
            type: 'order_status',
            title: 'تم تحديد سعر طلبك',
            body: 'تم إرسال عرض السعر الخاص بطلبك للمراجعة والموافقة',
            data: [
                'order_id' => $orderModel->id,
                'order_number' => $orderModel->order_number,
                'quote_status' => $orderModel->quote_status,
                'total_amount' => $orderModel->total_amount,
                'currency' => $orderModel->currency,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال عرض السعر للعميل بنجاح',
            'data' => [
                'order' => $orderModel->fresh(),
            ],
        ]);
    }
}
