<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class OrderAssignmentController extends Controller
{
    public function store(Request $request, int $order): JsonResponse
    {
        $validated = $request->validate([
            'technician_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')
                    ->where('role', 'technician')
                    ->where('is_active', true),
            ],
        ]);

        $orderModel = DB::transaction(function () use (
            $order,
            $validated
        ) {
            $orderModel = Order::query()
                ->lockForUpdate()
                ->findOrFail($order);

            if (! in_array($orderModel->status, [
                Order::STATUS_PENDING,
                Order::STATUS_CONFIRMED,
            ], true)) {
                throw ValidationException::withMessages([
                    'order' => [
                        'لا يمكن إسناد هذا الطلب في حالته الحالية',
                    ],
                ]);
            }

            $technicianId = (int) $validated['technician_id'];

            // Recheck inside the transaction before assigning.
            $technician = User::query()
                ->whereKey($technicianId)
                ->where('role', 'technician')
                ->where('is_active', true)
                ->first();

            if (! $technician) {
                throw ValidationException::withMessages([
                    'technician_id' => [
                        'الفني المحدد غير متاح للإسناد',
                    ],
                ]);
            }

            if ((int) $orderModel->technician_id !== $technicianId) {
                $orderModel->update([
                    'technician_id' => $technicianId,
                ]);
            }

            return $orderModel->fresh([
                'technician:id,name,phone,email,role,is_active',
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إسناد الطلب للفني بنجاح',
            'data' => [
                'order' => $orderModel,
            ],
        ]);
    }
}