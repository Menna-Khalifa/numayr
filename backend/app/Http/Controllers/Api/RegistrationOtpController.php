<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class RegistrationOtpController extends Controller
{
    public function verify(Request $request): JsonResponse
    {
        $normalizedPhone = \App\Support\SaudiPhone::normalize(
            (string) $request->input('phone', '')
        );

        if ($normalizedPhone !== null) {
            $request->merge(['phone' => $normalizedPhone]);
        }
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^05[0-9]{8}$/'],
            'otp' => ['required', 'digits:4'],
        ]);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $user = User::query()
                ->where('phone', $validated['phone'])
                ->where('role', 'customer')
                ->lockForUpdate()
                ->first();

            if (! $user || $user->is_active) {
                throw ValidationException::withMessages([
                    'otp' => ['رمز التحقق غير صحيح أو منتهي الصلاحية.'],
                ]);
            }

            $record = PasswordResetOtp::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'registration')
                ->where('channel', 'sms')
                ->whereNull('verified_at')
                ->latest('id')
                ->lockForUpdate()
                ->first();

            if (! $record || $record->isExpired() || $record->attempts >= 5) {
                throw ValidationException::withMessages([
                    'otp' => ['رمز التحقق غير صحيح أو منتهي الصلاحية.'],
                ]);
            }

            if (! Hash::check($validated['otp'], $record->otp_hash)) {
                $record->increment('attempts');

                return response()->json([
                    'message' => 'رمز التحقق غير صحيح أو منتهي الصلاحية.',
                    'errors' => [
                        'otp' => ['رمز التحقق غير صحيح أو منتهي الصلاحية.'],
                    ],
                ], 422);
            }

            $record->update(['verified_at' => now()]);

            $user->update(['is_active' => true]);

            User::query()
                ->where('role', 'admin')
                ->where('is_active', true)
                ->pluck('id')
                ->each(function (int $adminId) use ($user) {
                    Notification::query()->create([
                        'user_id' => $adminId,
                        'type' => 'customer_registration',
                        'title' => 'عميل جديد انضم إلى نمير',
                        'body' => $user->name.' أكمل تسجيل حسابه بنجاح.',
                        'data' => [
                            'customer_id' => $user->id,
                        ],
                        'channels' => ['in_app'],
                        'sent_at' => now(),
                    ]);
                });

            $token = $user->createToken('numayr-web')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'تم تأكيد رقم الجوال بنجاح.',
                'data' => [
                    'user' => $user->fresh(),
                    'token' => $token,
                ],
            ]);
        });
    }

    public function resend(Request $request, SmsService $smsService): JsonResponse
    {
        $normalizedPhone = \App\Support\SaudiPhone::normalize(
            (string) $request->input('phone', '')
        );

        if ($normalizedPhone !== null) {
            $request->merge(['phone' => $normalizedPhone]);
        }
        $validated = $request->validate([
            'phone' => ['required', 'string', 'regex:/^05[0-9]{8}$/'],
        ]);

        $message = [
            'success' => true,
            'message' => 'إذا كان الحساب بانتظار التفعيل، فقد يتم إرسال رمز تحقق جديد وفقًا لفترة الانتظار.',
        ];

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $smsService) {
            $user = User::query()
                ->where('phone', $validated['phone'])
                ->where('role', 'customer')
                ->lockForUpdate()
                ->first();

            if (! $user || $user->is_active) {
                return;
            }

            $latest = PasswordResetOtp::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'registration')
                ->latest('id')
                ->first();

            if ($latest && $latest->created_at->greaterThan(now()->subMinute())) {
                return;
            }

            $otp = (string) random_int(1000, 9999);

            PasswordResetOtp::query()
                ->where('user_id', $user->id)
                ->where('purpose', 'registration')
                ->whereNull('verified_at')
                ->delete();

            PasswordResetOtp::create([
                'user_id' => $user->id,
                'channel' => 'sms',
                'purpose' => 'registration',
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes((int) config('services.authentica.otp_ttl_minutes', 5)),
                'attempts' => 0,
            ]);

            $smsService->sendOtp($user->phone, $otp);
        });

        return response()->json($message);
    }
}