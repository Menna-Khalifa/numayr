<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cooler;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $customerQuery = User::query()->where('role', 'customer');

        $orderStatuses = [
            Order::STATUS_PENDING,
            Order::STATUS_CONFIRMED,
            Order::STATUS_IN_PROGRESS,
            Order::STATUS_COMPLETED,
            Order::STATUS_CANCELLED,
        ];

        $orderCounts = Order::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('status', $orderStatuses)
            ->groupBy('status')
            ->pluck('total', 'status');

        $paymentStatuses = [
            Payment::STATUS_PENDING,
            Payment::STATUS_PROCESSING,
            Payment::STATUS_PAID,
            Payment::STATUS_FAILED,
            Payment::STATUS_REFUNDED,
        ];

        $paymentCounts = Payment::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->whereIn('status', $paymentStatuses)
            ->groupBy('status')
            ->pluck('total', 'status');

        $today = Carbon::today();
        $from = $today->copy()->subDays(6);

        $ordersByDay = Order::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->whereDate('created_at', '>=', $from)
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day');

        $dailyOrders = collect(range(0, 6))
            ->map(function (int $offset) use ($from, $ordersByDay) {
                $date = $from->copy()->addDays($offset);
                $key = $date->toDateString();

                return [
                    'date' => $key,
                    'label' => $date->locale('ar')->translatedFormat('D'),
                    'total' => (int) ($ordersByDay[$key] ?? 0),
                ];
            })
            ->values();

        $serviceDistribution = Order::query()
            ->selectRaw('service_code, service_name, COUNT(*) as total')
            ->groupBy('service_code', 'service_name')
            ->orderByDesc('total')
            ->limit(6)
            ->get()
            ->map(fn ($row) => [
                'service_code' => $row->service_code,
                'service_name' => $row->service_name,
                'total' => (int) $row->total,
            ]);

        $recentOrders = Order::query()
            ->with([
                'user:id,name,email,phone,role',
                'cooler:id,user_id,name',
                'service:id,code,name_ar,name_en',
            ])
            ->latest('id')
            ->limit(6)
            ->get();

        $recentCustomers = User::query()
            ->where('role', 'customer')
            ->withCount([
                'coolers',
                'orders',
            ])
            ->latest('id')
            ->limit(6)
            ->get([
                'id',
                'name',
                'email',
                'phone',
                'is_active',
                'created_at',
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => [
                    'customers' => [
                        'total' => (clone $customerQuery)->count(),
                        'active' => (clone $customerQuery)->where('is_active', true)->count(),
                        'inactive' => (clone $customerQuery)->where('is_active', false)->count(),
                    ],
                    'coolers' => [
                        'total' => Cooler::query()->count(),
                    ],
                    'orders' => [
                        'total' => Order::query()->count(),
                        'pending' => (int) ($orderCounts[Order::STATUS_PENDING] ?? 0),
                        'confirmed' => (int) ($orderCounts[Order::STATUS_CONFIRMED] ?? 0),
                        'in_progress' => (int) ($orderCounts[Order::STATUS_IN_PROGRESS] ?? 0),
                        'completed' => (int) ($orderCounts[Order::STATUS_COMPLETED] ?? 0),
                        'cancelled' => (int) ($orderCounts[Order::STATUS_CANCELLED] ?? 0),
                    ],
                    'subscriptions' => [
                        'total' => Subscription::query()->count(),
                        'active' => Subscription::query()
                            ->where('status', Subscription::STATUS_ACTIVE)
                            ->count(),
                    ],
                    'payments' => [
                        'total' => Payment::query()->count(),
                        'pending' => (int) ($paymentCounts[Payment::STATUS_PENDING] ?? 0),
                        'processing' => (int) ($paymentCounts[Payment::STATUS_PROCESSING] ?? 0),
                        'paid' => (int) ($paymentCounts[Payment::STATUS_PAID] ?? 0),
                        'failed' => (int) ($paymentCounts[Payment::STATUS_FAILED] ?? 0),
                        'refunded' => (int) ($paymentCounts[Payment::STATUS_REFUNDED] ?? 0),
                    ],
                ],
                'daily_orders' => $dailyOrders,
                'service_distribution' => $serviceDistribution,
                'recent_orders' => $recentOrders,
                'recent_customers' => $recentCustomers,
            ],
        ]);
    }
}
