<?php

namespace App\Services\Payments;

use App\Services\Payments\Contracts\PaymentGateway;
use App\Services\Payments\Gateways\FakePaymentGateway;
use InvalidArgumentException;
use RuntimeException;

class PaymentGatewayManager
{
    public function driver(?string $provider = null): PaymentGateway
    {
        $provider ??= config('payments.default', 'fake');

        if (
            $provider === 'fake' &&
            app()->environment('production')
        ) {
            throw new RuntimeException(
                'The fake payment gateway cannot be used in production.'
            );
        }

        return match ($provider) {
            'fake' => app(FakePaymentGateway::class),

            default => throw new InvalidArgumentException(
                "Unsupported payment provider: {$provider}"
            ),
        };
    }
}
