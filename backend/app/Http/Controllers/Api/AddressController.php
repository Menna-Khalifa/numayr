<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'addresses' => $addresses,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:100'],
            'city' => ['required', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:255'],
            'street' => ['nullable', 'string', 'max:255'],
            'building' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'notes' => ['nullable', 'string'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        $address = DB::transaction(function () use ($user, $validated) {
            $shouldBeDefault = (bool) ($validated['is_default'] ?? false);

            if (! $user->addresses()->exists()) {
                $shouldBeDefault = true;
            }

            if ($shouldBeDefault) {
                $user->addresses()->update([
                    'is_default' => false,
                ]);
            }

            return $user->addresses()->create([
                ...$validated,
                'is_default' => $shouldBeDefault,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم إضافة العنوان بنجاح',
            'data' => [
                'address' => $address,
            ],
        ], 201);
    }

    public function update(Request $request, int $address): JsonResponse
    {
        $addressModel = $request->user()
            ->addresses()
            ->findOrFail($address);

        $validated = $request->validate([
            'label' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city' => ['sometimes', 'required', 'string', 'max:255'],
            'district' => ['sometimes', 'nullable', 'string', 'max:255'],
            'street' => ['sometimes', 'nullable', 'string', 'max:255'],
            'building' => ['sometimes', 'nullable', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'nullable', 'string', 'max:20'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        DB::transaction(function () use ($request, $addressModel, $validated) {
            if (($validated['is_default'] ?? false) === true) {
                $request->user()->addresses()
                    ->whereKeyNot($addressModel->id)
                    ->update([
                        'is_default' => false,
                    ]);
            }

            $addressModel->update($validated);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث العنوان بنجاح',
            'data' => [
                'address' => $addressModel->fresh(),
            ],
        ]);
    }

    public function destroy(Request $request, int $address): JsonResponse
    {
        $addressModel = $request->user()
            ->addresses()
            ->findOrFail($address);

        DB::transaction(function () use ($request, $addressModel) {
            // The cooler/subscription tables use nullOnDelete. Without this guard,
            // deleting a saved address silently detaches live service records.
            if (DB::table('coolers')->where('address_id', $addressModel->id)->exists()) {
                throw ValidationException::withMessages([
                    'address' => ['العنوان مرتبط ببرادة. انقل البرادة إلى عنوان آخر قبل الحذف.'],
                ]);
            }

            if (DB::table('subscriptions')->where('address_id', $addressModel->id)->exists()) {
                throw ValidationException::withMessages([
                    'address' => ['العنوان مرتبط باشتراك ولا يمكن حذفه حفاظًا على بيانات الاشتراك.'],
                ]);
            }

            $wasDefault = $addressModel->is_default;

            $addressModel->delete();

            if ($wasDefault) {
                $nextAddress = $request->user()
                    ->addresses()
                    ->latest()
                    ->first();

                $nextAddress?->update([
                    'is_default' => true,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'تم حذف العنوان بنجاح',
        ]);
    }

    public function setDefault(Request $request, int $address): JsonResponse
    {
        $addressModel = $request->user()
            ->addresses()
            ->findOrFail($address);

        DB::transaction(function () use ($request, $addressModel) {
            $request->user()->addresses()->update([
                'is_default' => false,
            ]);

            $addressModel->update([
                'is_default' => true,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'تم تعيين العنوان الافتراضي بنجاح',
            'data' => [
                'address' => $addressModel->fresh(),
            ],
        ]);
    }
}