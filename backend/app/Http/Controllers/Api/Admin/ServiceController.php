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

            'settings' => [
                'sometimes',
                'nullable',
                'array',
            ],
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
                'message' => 'Maximum quantity cannot be less than minimum quantity.',
                'errors' => [
                    'maximum_quantity' => [
                        'Maximum quantity cannot be less than minimum quantity.',
                    ],
                ],
            ], 422);
        }

        $service->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => [
                'service' => $service->fresh(),
            ],
        ]);
    }
}
