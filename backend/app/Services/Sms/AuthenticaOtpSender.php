<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class AuthenticaOtpSender
{
    public function sendOtp(string $phone, string $otp): void
    {
        $apiKey = config('services.authentica.api_key');

        if (!is_string($apiKey) || trim($apiKey) === '') {
            throw new RuntimeException(
                'Authentica API key is not configured.'
            );
        }

        if (!preg_match('/^05[0-9]{8}$/', $phone)) {
            throw new RuntimeException(
                'Invalid Saudi phone number.'
            );
        }

        if (!preg_match('/^[0-9]{4}$/', $otp)) {
            throw new RuntimeException(
                'OTP must contain four digits.'
            );
        }

        $internationalPhone = '+966' . substr($phone, 1);

        $baseUrl = rtrim(
            (string) config('services.authentica.base_url'),
            '/'
        );

        $response = Http::acceptJson()
            ->asJson()
            ->withHeaders([
                'X-Authorization' => $apiKey,
            ])
            ->timeout(15)
            ->post($baseUrl . '/api/v2/send-otp', [
                'method' => 'sms',
                'phone' => $internationalPhone,
                'otp' => $otp,
            ]);

        if (
            !$response->successful() ||
            $response->json('success') !== true
        ) {
            throw new RuntimeException(
                'Authentica OTP delivery request failed.'
            );
        }
    }
}