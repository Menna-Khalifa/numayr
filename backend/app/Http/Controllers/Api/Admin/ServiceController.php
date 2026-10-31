<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ServiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
$services = Service::query()
            ->orderBy('id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'services' => $services,
            ],
        ]);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
return response()->json([
            'success' => true,
            'data' => [
                'service' => $service,
            ],
        ]);
    }

    public function update(Request $request, Service $service): JsonResponse
    {
$validated = $request->validate([
            'name_ar' => ['sometimes', 'required', 'string', 'max:255'],
            'name_en' => ['sometimes', 'nullable', 'string', 'max:255'],

            'pricing_model' => [
                'sometimes',
                'required',
                Rule::in([
                    'fixed',
                    'per_unit',
                    'quote',
                ]),
            ],

            'base_price' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'unit_price' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'unit' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],

            'minimum_quantity' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'maximum_quantity' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'quantity_step' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0.01',
            ],

            'urgent_fee' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'settings' => ['sometimes', 'nullable', 'array'],
            'settings.options' => ['sometimes', 'array', 'min:1'],
            'settings.options.*.code' => ['required', 'string', 'max:100', 'distinct'],
            'settings.options.*.name_ar' => ['required', 'string', 'max:255'],
            'settings.options.*.price' => ['required', 'numeric', 'min:0'],
        ]);

        $minimumQuantity = array_key_exists('minimum_quantity', $validated)
            ? $validated['minimum_quantity']
            : $service->minimum_quantity;

        $maximumQuantity = array_key_exists('maximum_quantity', $validated)
            ? $validated['maximum_quantity']
            : $service->maximum_quantity;

        if (
            $minimumQuantity !== null
            && $maximumQuantity !== null
            && (float) $maximumQuantity < (float) $minimumQuantity
        ) {
            return response()->json([
                'success' => false,
                'message' => 'الحد الأقصى للكمية لا يمكن أن يقل عن الحد الأدنى',
                'errors' => [
                    'maximum_quantity' => [
                        'الحد الأقصى للكمية لا يمكن أن يقل عن الحد الأدنى',
                    ],
                ],
            ], 422);
        }

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الخدمة بنجاح',
            'data' => [
                'service' => $service->fresh(),
            ],
        ]);
    }
}
