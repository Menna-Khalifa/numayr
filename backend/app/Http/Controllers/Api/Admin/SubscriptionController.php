<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    Subscription::STATUS_PENDING,
                    Subscription::STATUS_ACTIVE,
                    Subscription::STATUS_CANCELLED,
                    Subscription::STATUS_EXPIRED,
                ]),
            ],

            'plan_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'billing_cycle' => [
                'sometimes',
                'nullable',
                Rule::in([
                    'monthly',
                    'yearly',
                ]),
            ],

            'user_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'address_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:addresses,id',
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

        $subscriptions = Subscription::query()
            ->with([
                'user:id,name,email,phone,role',
                'address',
                'coolers',
                'payments',
            ])
            ->withCount([
                'benefitUsages',
            ])
            ->when(
                $validated['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->when(
                $validated['plan_code'] ?? null,
                fn ($query, $planCode) => $query->where('plan_code', $planCode)
            )
            ->when(
                $validated['billing_cycle'] ?? null,
                fn ($query, $billingCycle) => $query->where('billing_cycle', $billingCycle)
            )
            ->when(
                $validated['user_id'] ?? null,
                fn ($query, $userId) => $query->where('user_id', $userId)
            )
            ->when(
                $validated['address_id'] ?? null,
                fn ($query, $addressId) => $query->where('address_id', $addressId)
            )
            ->when(
                $validated['search'] ?? null,
                function ($query, $search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('plan_code', 'like', "%{$search}%")
                            ->orWhere('plan_name_ar', 'like', "%{$search}%")
                            ->orWhere('plan_name_en', 'like', "%{$search}%")
                            ->orWhereHas(
                                'user',
                                function ($userQuery) use ($search) {
                                    $userQuery
                                        ->where('name', 'like', "%{$search}%")
                                        ->orWhere('email', 'like', "%{$search}%")
                                        ->orWhere('phone', 'like', "%{$search}%");
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
                'subscriptions' => $subscriptions,
            ],
        ]);
    }

    public function show(
        Request $request,
        Subscription $subscription
    ): JsonResponse {
        $subscription->load([
            'user:id,name,email,phone,role',
            'address',
            'coolers',
            'plan',
            'payments',
            'orders',
            'benefitUsages.order',
            'benefitUsages.cooler',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => $subscription,
            ],
        ]);
    }
}
