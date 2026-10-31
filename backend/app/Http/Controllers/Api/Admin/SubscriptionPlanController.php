<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubscriptionPlanController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'plans' => SubscriptionPlan::query()
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->get(),
            ],
        ]);
    }

    public function update(Request $request, SubscriptionPlan $subscriptionPlan): JsonResponse
    {
        $validated = $request->validate([
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'required', 'string', 'max:255'],
            'description_ar' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'description_en' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'billing_cycle' => ['sometimes', Rule::in(['monthly', 'yearly'])],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3', Rule::in(['SAR','USD','AED','KWD','BHD','QAR','OMR'])],
            'benefits' => ['sometimes', 'array'],
            'benefits.annual_inspections' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'benefits.smart_alerts' => ['sometimes', 'boolean'],
            'benefits.priority_service' => ['sometimes', 'boolean'],
            'benefits.discount_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'benefits.included_filter_changes' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'savings_percent' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:100'],
            'is_featured' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:1000'],
        ]);

        if (isset($validated['currency'])) {
            $validated['currency'] = strtoupper($validated['currency']);
        }

        $subscriptionPlan->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث باقة الاشتراك بنجاح',
            'data' => ['plan' => $subscriptionPlan->fresh()],
        ]);
    }
}
