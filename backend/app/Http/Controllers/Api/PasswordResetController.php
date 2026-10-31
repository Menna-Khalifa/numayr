<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function requestOtp(
        Request $request,
        SmsService $smsService
    ): JsonResponse {
        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'max:30',
            ],
        ]);

        $inputPhone = trim($validated['phone']);
$phone = \App\Support\SaudiPhone::normalize($inputPhone) ?? $inputPhone;

        $user = User::query()
            ->where('phone', $phone)
            ->first();

        if (! $user || ! $user->is_active) {
            return response()->json([
                'success' => true,
                'message' => 'إذا كان رقم الجوال مسجلًا لدينا، فقد يتم إرسال رمز التحقق وفقًا لفترة الانتظار.',
                'data' => [
                    'expires_in_minutes' => (int) config('services.authentica.otp_ttl_minutes', 5),
                ],
            ]);
        }

        \Illuminate\Support\Facades\DB::transaction(function () use ($user, $smsService) {
            User::query()
                ->whereKey($user->id)
                ->lockForUpdate()
                ->firstOrFail();

            $latest = PasswordResetOtp::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'password_reset')
                ->whereNull('verified_at')
                ->latest('id')
                ->first();

            if (
                $latest &&
                $latest->created_at->greaterThan(now()->subMinute())
            ) {
                return;
            }


            PasswordResetOtp::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'password_reset')
                ->whereNull('verified_at')
                ->delete();

            $otp = (string) random_int(1000, 9999);

            PasswordResetOtp::create([
                'user_id' => $user->id,
                'channel' => 'sms',
                'purpose' => 'password_reset',
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes((int) config('services.authentica.otp_ttl_minutes', 5)),
                'attempts' => 0,
            ]);

            $smsService->sendOtp($user->phone, $otp);
        });
        return response()->json([
            'success' => true,
            'message' => 'إذا كان رقم الجوال مسجلًا لدينا، فقد يتم إرسال رمز التحقق وفقًا لفترة الانتظار.',
            'data' => [
                'expires_in_minutes' => (int) config('services.authentica.otp_ttl_minutes', 5),

            ],
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => [
                'required',
                'string',
                'max:30',
            ],

            'otp' => [
                'required',
                'digits:4',
            ],
        ]);

        $inputPhone = trim($validated['phone']);
$phone = \App\Support\SaudiPhone::normalize($inputPhone) ?? $inputPhone;

        $user = User::query()
            ->where('phone', $phone)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'otp' => [
                    'رمز التحقق غير صحيح أو منتهي الصلاحية',
                ],
            ]);
        }

        $otpRecord = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->where('channel', 'sms')
            ->where('purpose', 'password_reset')
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (
            ! $otpRecord ||
            $otpRecord->isExpired()
        ) {
            throw ValidationException::withMessages([
                'otp' => [
                    'رمز التحقق غير صحيح أو منتهي الصلاحية',
                ],
            ]);
        }

        if ($otpRecord->attempts >= 5) {
            throw ValidationException::withMessages([
                'otp' => [
                    'تم تجاوز عدد محاولات التحقق المسموح بها',
                ],
            ]);
        }

        if (
            ! Hash::check(
                $validated['otp'],
                $otpRecord->otp_hash
            )
        ) {
            $otpRecord->increment('attempts');

            throw ValidationException::withMessages([
                'otp' => [
                    'رمز التحقق غير صحيح',
                ],
            ]);
        }

        $otpRecord->update([
            'verified_at' => now(),
        ]);

        $resetToken = Str::random(64);

        cache()->put(
            'password-reset:'.$resetToken,
            $user->id,
            now()->addMinutes(15)
        );

        return response()->json([
            'success' => true,
            'message' => 'تم التحقق من الرمز بنجاح',
            'data' => [
                'reset_token' => $resetToken,
                'expires_in_minutes' => 15,
            ],
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'reset_token' => [
                'required',
                'string',
                'size:64',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $cacheKey = 'password-reset:'.$validated['reset_token'];

        $userId = cache()->get($cacheKey);

        if (! $userId) {
            throw ValidationException::withMessages([
                'reset_token' => [
                    'رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية',
                ],
            ]);
        }

        $user = User::findOrFail($userId);

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'reset_token' => [
                    'الحساب موقوف حاليًا',
                ],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        $user->tokens()->delete();

        PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'password_reset')
            ->delete();

        cache()->forget($cacheKey);

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح',
        ]);
    }
}
