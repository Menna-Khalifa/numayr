<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Throwable;

class CoolerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $coolers = $request->user()
            ->coolers()
            ->with('address')
            ->latest()
            ->get()
            ->map(fn ($cooler) => $this->presentCooler($cooler));

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
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
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
            'water_source' => [
                'required',
                \Illuminate\Validation\Rule::in(['network', 'tanker']),
            ],
            'tank_capacity_liters' => [
                'nullable',
                'required_if:water_source,tanker',
                'integer',
                'min:1',
                'max:10000000',
            ],
            'filter_installed_at' => [
                'nullable',
                'date',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $validated['tank_capacity_liters'] = ($validated['water_source'] ?? null) === 'tanker'
            ? ($validated['tank_capacity_liters'] ?? null)
            : null;

        $user = $request->user();

        if (! empty($validated['address_id'])) {
            $ownsAddress = $user->addresses()
                ->whereKey($validated['address_id'])
                ->exists();

            if (! $ownsAddress) {
                return response()->json([
                    'success' => false,
                    'message' => 'العنوان المحدد غير تابع لهذا المستخدم',
                ], 422);
            }
        }

        $photo = $validated['photo'] ?? null;
        unset($validated['photo']);

        $photoPath = null;

        if ($photo instanceof UploadedFile) {
            $photoPath = $photo->store(
                'coolers/'.$user->id,
                'public'
            );
        }

        try {
            $cooler = DB::transaction(function () use ($user, $validated, $photoPath) {
                $created = $user->coolers()->create([
                    ...$validated,
                    'photo' => $photoPath,
                    'status' => 'unknown',
                    'health_score' => null,
                    'is_active' => true,
                ]);

                $created->approval_status = 'pending_review';
                $created->rejection_reason = null;
                $created->reviewed_at = null;
                $created->reviewed_by_user_id = null;
                $created->save();

                return $created;
            });
        } catch (Throwable $exception) {
            if ($photoPath) {
                Storage::disk('public')->delete($photoPath);
            }

            throw $exception;
        }

        Notification::query()->create([
            'user_id' => $user->id,
            'type' => 'cooler_review',
            'title' => 'تم استلام البرادة للمراجعة',
            'body' => 'تم تسجيل البرادة وسيتم إشعارك فور مراجعتها من الإدارة.',
            'data' => [
                'cooler_id' => $cooler->id,
                'approval_status' => 'pending_review',
            ],
            'channels' => ['in_app'],
            'sent_at' => now(),
        ]);

        User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->pluck('id')
            ->each(function (int $adminId) use ($cooler, $user) {
                Notification::query()->create([
                    'user_id' => $adminId,
                    'type' => 'cooler_review',
                    'title' => 'برادة جديدة بانتظار المراجعة',
                    'body' => $user->name.' أضاف برادة جديدة تحتاج إلى مراجعة.',
                    'data' => [
                        'cooler_id' => $cooler->id,
                        'customer_id' => $user->id,
                        'approval_status' => 'pending_review',
                    ],
                    'channels' => ['in_app'],
                    'sent_at' => now(),
                ]);
            });

        $cooler->load('address');

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة البرادة وإرسالها للمراجعة',
            'data' => [
                'cooler' => $this->presentCooler($cooler),
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
                'cooler' => $this->presentCooler($coolerModel),
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
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'remove_photo' => [
                'sometimes',
                'boolean',
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
            'water_source' => [
                'sometimes',
                'nullable',
                \Illuminate\Validation\Rule::in(['network', 'tanker']),
            ],
            'tank_capacity_liters' => [
                'sometimes',
                'nullable',
                'required_if:water_source,tanker',
                'integer',
                'min:1',
                'max:10000000',
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
                'max:5000',
            ],
        ]);

        if (
            array_key_exists('address_id', $validated) &&
            ! empty($validated['address_id'])
        ) {
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

        $photo = $validated['photo'] ?? null;
        $removePhoto = (bool) ($validated['remove_photo'] ?? false);

        unset(
            $validated['photo'],
            $validated['remove_photo']
        );

        $oldPhoto = $coolerModel->photo;
        $newPhoto = null;

        // Keep the existing photo until the replacement and database save succeed.
        if ($photo instanceof UploadedFile) {
            $newPhoto = $photo->store(
                'coolers/'.$request->user()->id,
                'public'
            );

            if (! is_string($newPhoto) || $newPhoto === '') {
                return response()->json([
                    'success' => false,
                    'message' => 'تعذر رفع الصورة، يرجى المحاولة مرة أخرى',
                ], 422);
            }

            $validated['photo'] = $newPhoto;
        } elseif ($removePhoto) {
            $validated['photo'] = null;
        }

        if (array_key_exists('water_source', $validated)) {
            $validated['tank_capacity_liters'] = $validated['water_source'] === 'tanker'
                ? ($validated['tank_capacity_liters'] ?? null)
                : null;
        }

        try {
            DB::transaction(function () use ($coolerModel, $validated) {
                $coolerModel->update($validated);
                $coolerModel->approval_status = 'pending_review';
                $coolerModel->rejection_reason = null;
                $coolerModel->reviewed_at = null;
                $coolerModel->reviewed_by_user_id = null;
                $coolerModel->save();
            });
        } catch (Throwable $exception) {
            if ($newPhoto !== null) {
                Storage::disk('public')->delete($newPhoto);
            }

            throw $exception;
        }

        if ($oldPhoto && ($newPhoto !== null || $removePhoto)) {
            Storage::disk('public')->delete($oldPhoto);
        }

        User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->pluck('id')
            ->each(function (int $adminId) use ($coolerModel, $request) {
                Notification::query()->create([
                    'user_id' => $adminId,
                    'type' => 'cooler_review',
                    'title' => 'برادة معدلة تحتاج إلى المراجعة',
                    'body' => $request->user()->name.' عدّل بيانات برادة ويجب مراجعتها.',
                    'data' => [
                        'cooler_id' => $coolerModel->id,
                        'customer_id' => $request->user()->id,
                        'approval_status' => 'pending_review',
                    ],
                    'channels' => ['in_app'],
                    'sent_at' => now(),
                ]);
            });

        $coolerModel->load('address');

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث البرادة وإرسالها للمراجعة',
            'data' => [
                'cooler' => $this->presentCooler($coolerModel),
            ],
        ]);
    }

    public function destroy(Request $request, int $cooler): JsonResponse
    {
        $coolerModel = $request->user()
            ->coolers()
            ->findOrFail($cooler);

        if ($coolerModel->photo) {
            Storage::disk('public')->delete($coolerModel->photo);
        }

        $coolerModel->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف البرادة بنجاح',
        ]);
    }

    private function presentCooler($cooler): mixed
    {
        if ($cooler->photo) {
            $cooler->setAttribute(
                'photo_url',
                url(Storage::disk('public')->url($cooler->photo))
            );
        } else {
            $cooler->setAttribute('photo_url', null);
        }

        return $cooler;
    }
}
