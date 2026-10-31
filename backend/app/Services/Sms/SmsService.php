<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Log;
use RuntimeException;

class SmsService
{
    public function send(string $phone, string $message): void
    {
        $driver = config('services.sms.driver', 'log');

        if ($driver === 'log') {
            if (! app()->environment(['local', 'testing'])) {
                throw new RuntimeException(
                    'The SMS log driver cannot be used in production.'
                );
            }

            Log::info('NUMAYR SMS', [
                'phone' => $phone,
                'message' => $message,
            ]);

            return;
        }

        if ($driver === 'authentica') {
            app(AuthenticaOtpSender::class)->sendSms($phone, $message);
            return;
        }

        throw new RuntimeException(
            "Unsupported SMS driver: {$driver}"
        );
    }

    public function sendOtp(string $phone, string $otp): void
    {
        if (config('services.sms.driver', 'log') === 'authentica') {
            app(AuthenticaOtpSender::class)->sendOtp($phone, $otp);
            return;
        }
        $this->send(
            $phone,
            "رمز التحقق الخاص بك في نمير هو: {$otp}"
        );
    }
}
