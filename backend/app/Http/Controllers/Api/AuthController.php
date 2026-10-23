<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(
        Request $request,
        \App\Services\Sms\SmsService $smsService
    ): JsonResponse {
        $normalizedPhone = \App\Support\SaudiPhone::normalize(
            (string) $request->input('phone', '')
        );

        if ($normalizedPhone !== null) {
            $request->merge(['phone' => $normalizedPhone]);
        }
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^05[0-9]{8}$/', 'unique:users,phone'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $phone = $validated['phone'];
        $digits = substr($phone, 1);

        $variants = [
            $phone,
            $digits,
            '966'.$digits,
            '+966'.$digits,
            '00966'.$digits,
        ];

        if (User::query()->whereIn('phone', $variants)->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'phone' => ['رقم الجوال مسجل بالفعل'],
            ]);
        }
        $otp = (string) random_int(1000, 9999);

        $user = \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $otp, $smsService) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'],
                'role' => 'customer',
                'is_active' => false,
                'password' => $validated['password'],
            ]);

            \App\Models\PasswordResetOtp::create([
                'user_id' => $user->id,
                'channel' => 'sms',
                'purpose' => 'registration',
                'otp_hash' => \Illuminate\Support\Facades\Hash::make($otp),
                'expires_at' => now()->addMinutes((int) config('services.authentica.otp_ttl_minutes', 5)),
                'attempts' => 0,
            ]);

            $smsService->sendOtp($user->phone, $otp);

            return $user;
        });

        return response()->json([
            'success' => true,
            'message' => 'Account created. Please verify your phone number.',
            'data' => [
                'phone' => $user->phone,
                'requires_phone_verification' => true,
                'expires_in_minutes' => 10,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        $identifier = trim($validated['email']);

        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            $users = User::query()
                ->where('email', $identifier)
                ->limit(2)
                ->get();
        } else {
            $users = User::query()
                ->whereIn('phone', $this->phoneVariants($identifier))
                ->limit(2)
                ->get();
        }

        $user = $users->count() === 1 ? $users->first() : null;

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الدخول غير صحيحة'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['الحساب موقوف حاليًا'],
            ]);
        }

        $user->tokens()->delete();

        $token = $user->createToken('numayr-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الدخول بنجاح',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    private function phoneVariants(string $phone): array
    {
        $phone = trim($phone);
        $clean = preg_replace('/[\s\-()]/u', '', $phone);

        $variants = [$phone, $clean];

        if (preg_match('/^05\d{8}$/', $clean)) {
            $national = substr($clean, 1);
        } elseif (preg_match('/^5\d{8}$/', $clean)) {
            $national = $clean;
        } elseif (preg_match('/^(?:966|\+966|00966)(5\d{8})$/', $clean, $matches)) {
            $national = $matches[1];
        } else {
            return array_values(array_unique($variants));
        }

        return array_values(array_unique([
            ...$variants,
            $national,
            '0' . $national,
            '966' . $national,
            '+966' . $national,
            '00966' . $national,
        ]));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }
}
