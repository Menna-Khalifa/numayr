<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function requestOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            return response()->json([
                'success' => true,
                'message' => 'إذا كان البريد مسجلًا لدينا فسيتم إرسال رمز التحقق',
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['الحساب موقوف حاليًا'],
            ]);
        }

        PasswordResetOtp::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->delete();

        $otp = (string) random_int(1000, 9999);

        PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'email',
            'otp_hash' => Hash::make($otp),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء رمز التحقق بنجاح',
            'data' => [
                'expires_in_minutes' => 10,
                'debug_otp' => app()->isLocal() ? $otp : null,
            ],
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:4'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'otp' => ['رمز التحقق غير صحيح أو منتهي الصلاحية'],
            ]);
        }

        $otpRecord = PasswordResetOtp::where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (! $otpRecord || $otpRecord->isExpired()) {
            throw ValidationException::withMessages([
                'otp' => ['رمز التحقق غير صحيح أو منتهي الصلاحية'],
            ]);
        }

        if ($otpRecord->attempts >= 5) {
            throw ValidationException::withMessages([
                'otp' => ['تم تجاوز عدد محاولات التحقق المسموح بها'],
            ]);
        }

        if (! Hash::check($validated['otp'], $otpRecord->otp_hash)) {
            $otpRecord->increment('attempts');

            throw ValidationException::withMessages([
                'otp' => ['رمز التحقق غير صحيح'],
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
            'reset_token' => ['required', 'string', 'size:64'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $cacheKey = 'password-reset:'.$validated['reset_token'];
        $userId = cache()->get($cacheKey);

        if (! $userId) {
            throw ValidationException::withMessages([
                'reset_token' => ['رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية'],
            ]);
        }

        $user = User::findOrFail($userId);

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'reset_token' => ['الحساب موقوف حاليًا'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        $user->tokens()->delete();

        PasswordResetOtp::where('user_id', $user->id)->delete();

        cache()->forget($cacheKey);

        return response()->json([
            'success' => true,
            'message' => 'تم تغيير كلمة المرور بنجاح',
        ]);
    }
}