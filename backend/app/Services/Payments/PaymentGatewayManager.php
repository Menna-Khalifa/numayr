<?php

namespace App\Services\Payments;

use App\Services\Payments\Contracts\PaymentGateway;
use App\Services\Payments\Gateways\FakePaymentGateway;
use InvalidArgumentException;

class PaymentGatewayManager
{
    public function driver(?string $provider = null): PaymentGateway
    {
        $provider ??= config('payments.default', 'fake');

        return match ($provider) {
            'fake' => app(FakePaymentGateway::class),

            default => throw new InvalidArgumentException(
                "Unsupported payment provider: {$provider}"
            ),
        };
    }
}