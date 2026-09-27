<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CoolerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coolers = $request->user()
            ->coolers()
            ->with('address')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'coolers' => $coolers,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address_id' => [
                'nullable',
                'integer',
                'exists:addresses,id',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'photo' => [
                'nullable',
                'string',
                'max:2048',
            ],
            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'nullable',
                'numeric',
                'between:-180,180',
            ],
            'landmark' => [
                'nullable',
                'string',
                'max:255',
            ],
            'filter_type' => [
                'nullable',
                'string',
                'max:255',
            ],
            'filter_installed_at' => [
                'nullable',
                'date',
            ],
            'notes' => [
                'nullable',
                'string',
            ],
        ]);

        if (! empty($validated['address_id'])) {
            $ownsAddress = $request->user()
                ->addresses()
                ->whereKey($validated['address_id'])
                ->exists();

            if (! $ownsAddress) {
                return response()->json([
                    'success' => false,
                    'message' => 'العنوان المحدد غير تابع لهذا المستخدم',
                ], 422);
            }
        }

        $cooler = $request->user()->coolers()->create([
            ...$validated,
            'status' => 'unknown',
            'health_score' => null,
            'is_active' => true,
        ]);

        $cooler->load('address');

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة البرادة بنجاح',
            'data' => [
                'cooler' => $cooler,
            ],
        ], 201);
    }

    public function show(Request $request, int $cooler): JsonResponse
    {
        $coolerModel = $request->user()
            ->coolers()
            ->with('address')
            ->findOrFail($cooler);

        return response()->json([
            'success' => true,
            'data' => [
                'cooler' => $coolerModel,
            ],
        ]);
    }

    public function update(Request $request, int $cooler): JsonResponse
    {
        $coolerModel = $request->user()
            ->coolers()
            ->findOrFail($cooler);

        $validated = $request->validate([
            'address_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:addresses,id',
            ],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'photo' => [
                'sometimes',
                'nullable',
                'string',
                'max:2048',
            ],
            'latitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-180,180',
            ],
            'landmark' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'filter_type' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'filter_installed_at' => [
                'sometimes',
                'nullable',
                'date',
            ],
            'notes' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        if (array_key_exists('address_id', $validated) && $validated['address_id'] !== null) {
            $ownsAddress = $request->user()
                ->addresses()
                ->whereKey($validated['address_id'])
                ->exists();

            if (! $ownsAddress) {
                return response()->json([
                    'success' => false,
                    'message' => 'العنوان المحدد غير تابع لهذا المستخدم',
                ], 422);
            }
        }

        $coolerModel->update($validated);

        $coolerModel->load('address');

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات البرادة بنجاح',
            'data' => [
                'cooler' => $coolerModel,
            ],
        ]);
    }

    public function destroy(Request $request, int $cooler): JsonResponse
    {
        $coolerModel = $request->user()
            ->coolers()
            ->findOrFail($cooler);

        $coolerModel->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف البرادة بنجاح',
        ]);
    }
}