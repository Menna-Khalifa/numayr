<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TechnicianOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'string',
                'in:pending,confirmed,in_progress,completed,cancelled',
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:50',
            ],
        ]);

        $user = $request->user();

        $query = $user->assignedOrders()
            ->select([
                'id',
                'technician_id',
                'order_number',
                'service_code',
                'service_name',
                'status',
                'priority',
                'preferred_date',
                'preferred_time_slot',
                'scheduled_at',
                'created_at',
            ]);

        if (isset($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $orders = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
            ],
        ]);
    }
}