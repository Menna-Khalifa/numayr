<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class AuthenticaOtpSender
{
    public function sendSms(string $phone, string $message): void
    {
        $apiKey = config('services.authentica.api_key');
        $sender = trim((string) config('services.sms.from', ''));
        if (! is_string($apiKey) || trim($apiKey) === '' || $sender === '') {
            throw new RuntimeException('Authentica SMS configuration is incomplete.');
        }
        if (! preg_match('/^05[0-9]{8}$/', $phone) || trim($message) === '') {
            throw new RuntimeException('Invalid SMS recipient or empty message.');
        }
        $url = rtrim((string) config('services.authentica.base_url'), '/').'/api/v2/send-sms';
        $response = Http::acceptJson()->asJson()
            ->withHeaders(['X-Authorization' => $apiKey])
            ->timeout((int) config('services.authentica.timeout', 15))
            ->post($url, [
                'phone' => '+966'.substr($phone, 1),
                'message' => $message,
                'sender_name' => $sender,
            ]);
        if (! $response->successful() || $response->json('success') === false) {
            throw new RuntimeException('Authentica SMS delivery request failed.');
        }
    }

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
            ->timeout((int) config('services.authentica.timeout', 15))
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