<?php

namespace App\Services\Payments\Gateways;

use App\Models\Payment;
use App\Services\Payments\Contracts\PaymentGateway;

class FakePaymentGateway implements PaymentGateway
{
    public function createPayment(Payment $payment): array
    {
        return [
            'success' => true,
            'reference' => 'FAKE-' . $payment->id,
            'checkout_url' => null,
            'status' => Payment::STATUS_PROCESSING,
        ];
    }

    public function verifyPayment(string $reference): array
    {
        return [
            'success' => true,
            'reference' => $reference,
            'status' => Payment::STATUS_PAID,
        ];
    }

    public function refundPayment(Payment $payment): array
    {
        return [
            'success' => true,
            'reference' => $payment->provider_reference,
            'status' => Payment::STATUS_REFUNDED,
        ];
    }

    public function verifyWebhookSignature(
        string $payload,
        ?string $signature
    ): bool {
        return true;
    }

    public function parseWebhook(array $payload): array
    {
        return [
            'reference' => $payload['reference'] ?? null,
            'status' => $payload['status'] ?? null,
            'transaction_id' => $payload['transaction_id'] ?? null,
        ];
    }
}