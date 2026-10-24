<?php

namespace App\Services\Payments\Gateways;

use App\Models\Payment;
use App\Services\Payments\Contracts\PaymentGateway;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class MoyasarGateway implements PaymentGateway
{
    private function baseUrl(): string
    {
        return rtrim(
            config('services.moyasar.base_url', 'https://api.moyasar.com/v1'),
            '/'
        );
    }

    private function client()
    {
        $key = config('services.moyasar.secret_key');

        if (!is_string($key) || trim($key) === '') {
            throw new RuntimeException('Moyasar secret key is not configured.');
        }

        $mode = config('services.moyasar.mode', 'test');
        $prefix = $mode === 'live' ? 'sk_live_' : 'sk_test_';
        if (!in_array($mode, ['test', 'live'], true)
            || !str_starts_with($key, $prefix)) {
            throw new RuntimeException(
                'Moyasar secret key does not match the configured payment mode.'
            );
        }

        return Http::withBasicAuth($key, '')
            ->acceptJson()
            ->asJson()
            ->timeout(20);
    }

    private function amountInHalalas(string $amount): int
    {
        if (!preg_match('/^\d+(\.\d{1,2})?$/', $amount)) {
            throw new RuntimeException('Invalid payment amount.');
        }

        [$riyals, $halalas] = array_pad(
            explode('.', $amount, 2),
            2,
            '0'
        );

        $result = ((int) $riyals * 100)
            + (int) str_pad($halalas, 2, '0');

        if ($result < 100) {
            throw new RuntimeException('Payment amount must be at least 1 SAR.');
        }

        return $result;
    }

    public function createPayment(Payment $payment): array
    {
        $callbackUrl = config('services.moyasar.callback_url');

        if (!is_string($callbackUrl) ||
            !filter_var($callbackUrl, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Moyasar callback URL is not configured.');
        }

        $currency = strtoupper($payment->currency);

        if ($currency !== 'SAR') {
            throw new RuntimeException('Only SAR is supported by this integration.');
        }

        $response = $this->client()->post(
            $this->baseUrl() . '/payment_intents',
            [
                'amount' => $this->amountInHalalas(
                    (string) $payment->amount
                ),
                'currency' => $currency,
                'description' => 'NUMAYR Payment #' . $payment->id,
                'callback_url' => $callbackUrl,
            ]
        );

        if (!$response->successful()) {
            throw new RuntimeException(
                'Moyasar could not create the payment intent. HTTP '
                . $response->status()
            );
        }

        $data = $response->json();

        if (!is_array($data) ||
            empty($data['id']) ||
            empty($data['client_secret']) ||
            empty($data['expires_at'])) {
            throw new RuntimeException('Invalid Moyasar intent response.');
        }

        return [
            'success' => true,
            'reference' => $data['id'],
            'checkout_url' => null,
            'client_secret' => $data['client_secret'],
            'expires_at' => $data['expires_at'],
            'status' => Payment::STATUS_PROCESSING,
        ];
    }

    public function verifyPayment(string $reference): array
    {
        $response = $this->client()->get(
            $this->baseUrl() . '/payments/' . rawurlencode($reference)
        );

        if (!$response->successful()) {
            throw new RuntimeException(
                'Moyasar payment verification failed. HTTP '
                . $response->status()
            );
        }

        $data = $response->json();

        if (!is_array($data) ||
            ($data['id'] ?? null) !== $reference) {
            throw new RuntimeException('Invalid Moyasar payment response.');
        }

        $status = match ($data['status'] ?? null) {
            'paid', 'captured' => Payment::STATUS_PAID,
            'failed', 'voided' => Payment::STATUS_FAILED,
            'refunded' => Payment::STATUS_REFUNDED,
            'initiated', 'authorized' => Payment::STATUS_PROCESSING,
            default => throw new RuntimeException(
                'Unknown Moyasar payment status.'
            ),
        };

        return [
            'success' => true,
            'reference' => $reference,
            'status' => $status,
            'amount' => $data['amount'] ?? null,
            'currency' => $data['currency'] ?? null,
            'description' => $data['description'] ?? null,
        ];
    }

    public function refundPayment(Payment $payment): array
    {
        throw new RuntimeException(
            'Moyasar refunds are not enabled yet.'
        );
    }

    public function verifyWebhookSignature(
        string $payload,
        ?string $signature
    ): bool {
        // Moyasar includes the configured shared secret as secret_token
        // inside the JSON webhook body, rather than an HMAC header.
        $secret = config('services.moyasar.webhook_secret');
        if (!is_string($secret) || $secret === '') {
            return false;
        }

        $event = json_decode($payload, true);
        if (!is_array($event) || !is_string($event['secret_token'] ?? null)) {
            return false;
        }

        return hash_equals($secret, $event['secret_token']);
    }

    public function parseWebhook(array $payload): array
    {
        $data = $payload['data'] ?? [];

        if (!is_array($data)) {
            return [];
        }

        $status = match ($data['status'] ?? null) {
            'paid', 'captured' => Payment::STATUS_PAID,
            'failed', 'voided' => Payment::STATUS_FAILED,
            'refunded' => Payment::STATUS_REFUNDED,
            'initiated', 'authorized' => Payment::STATUS_PROCESSING,
            default => null,
        };

        return [
            'reference' => $data['id'] ?? null,
            'status' => $status,
            'transaction_id' => $data['id'] ?? null,
            'amount' => $data['amount'] ?? null,
            'currency' => $data['currency'] ?? null,
        ];
    }
}
