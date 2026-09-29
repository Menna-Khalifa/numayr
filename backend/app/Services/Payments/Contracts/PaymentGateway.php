<?php

namespace App\Services\Payments\Contracts;

use App\Models\Payment;

interface PaymentGateway
{
    public function createPayment(Payment $payment): array;

    public function verifyPayment(string $reference): array;

    public function refundPayment(Payment $payment): array;

    public function verifyWebhookSignature(
        string $payload,
        ?string $signature
    ): bool;

    public function parseWebhook(array $payload): array;
}