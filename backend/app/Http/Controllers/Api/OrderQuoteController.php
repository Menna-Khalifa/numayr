<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderQuoteController extends Controller
{
    public function approve(Request $request, int $order): JsonResponse
    {
        $orderModel = DB::transaction(function () use ($request, $order) {
            $orderModel = Order::query()
                ->where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->findOrFail($order);

            $this->validateQuoteDecision($orderModel);

            $orderModel->update([
                'quote_status' => Order::QUOTE_STATUS_APPROVED,
                'quote_approved_at' => now(),
                'quote_rejected_at' => null,
            ]);

            return $orderModel;
        });

        return response()->json([
            'success' => true,
            'message' => 'تمت الموافقة على عرض السعر ويمكنك الآن إتمام الدفع',
            'data' => [
                'order' => $orderModel->fresh(),
            ],
        ]);
    }

    public function reject(Request $request, int $order): JsonResponse
    {
        $orderModel = DB::transaction(function () use ($request, $order) {
            $orderModel = Order::query()
                ->where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->findOrFail($order);

            $this->validateQuoteDecision($orderModel);

            $orderModel->update([
                'quote_status' => Order::QUOTE_STATUS_REJECTED,
                'quote_approved_at' => null,
                'quote_rejected_at' => now(),
            ]);

            return $orderModel;
        });

        return response()->json([
            'success' => true,
            'message' => 'تم رفض عرض السعر بنجاح',
            'data' => [
                'order' => $orderModel->fresh(),
            ],
        ]);
    }

    private function validateQuoteDecision(Order $order): void
    {
        if ($order->pricing_model !== 'quote') {
            throw ValidationException::withMessages([
                'order' => ['هذا الطلب لا يحتاج إلى موافقة على عرض سعر'],
            ]);
        }

        if ($order->status !== Order::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'order' => ['لا يمكن اتخاذ قرار بشأن العرض في حالة الطلب الحالية'],
            ]);
        }

        if ($order->quote_status !== Order::QUOTE_STATUS_AWAITING_APPROVAL) {
            throw ValidationException::withMessages([
                'quote' => ['لا يوجد عرض سعر متاح للموافقة أو الرفض'],
            ]);
        }

        if (
            $order->quote_subtotal === null ||
            $order->quoted_at === null ||
            (float) $order->total_amount <= 0
        ) {
            throw ValidationException::withMessages([
                'quote' => ['بيانات عرض السعر غير مكتملة'],
            ]);
        }

        if ($order->payments()
            ->whereIn('status', [
                Payment::STATUS_PENDING,
                Payment::STATUS_PROCESSING,
                Payment::STATUS_PAID,
            ])
            ->exists()
        ) {
            throw ValidationException::withMessages([
                'payment' => ['لا يمكن تغيير قرار عرض السعر مع وجود عملية دفع نشطة أو مكتملة'],
            ]);
        }
    }
}
