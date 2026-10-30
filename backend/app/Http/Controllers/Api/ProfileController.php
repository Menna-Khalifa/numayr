<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile');

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->exists("phone")) {
            $normalizedPhone = \App\Support\SaudiPhone::normalize((string) $request->input("phone"));
            if ($normalizedPhone !== null) {
                $request->merge(["phone" => $normalizedPhone]);
            }
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'regex:/^05[0-9]{8}$/', 'unique:users,phone,' . $user->id],
            'avatar' => ['nullable', 'string', 'max:2048'],
            'city' => ['nullable', 'string', 'max:255'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
        ]);

        if (array_key_exists('phone', $validated)) {
            $phone = $validated['phone'];
            $digits = substr($phone, 1);
            $variants = [$phone, $digits, '966'.$digits, '+966'.$digits, '00966'.$digits];
            if (\App\Models\User::query()
                ->whereKeyNot($user->id)
                ->whereIn('phone', $variants)
                ->exists()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'phone' => ['رقم الجوال مسجل بالفعل'],
                ]);
            }
        }

        $user->update([
            'name' => $validated['name'] ?? $user->name,
            'phone' => $validated['phone'] ?? $user->phone,
        ]);

        $profileData = collect($validated)->only([
            'avatar',
            'city',
            'nationality',
            'birth_date',
        ])->toArray();

        if (! empty($profileData)) {
            UserProfile::updateOrCreate(
                ['user_id' => $user->id],
                $profileData
            );
        }

        $user->load('profile');

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الملف الشخصي بنجاح',
            'data' => [
                'user' => $user,
            ],
        ]);
    }
}