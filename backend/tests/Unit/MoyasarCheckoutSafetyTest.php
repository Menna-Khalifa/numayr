<?php

namespace Tests\Unit;

use App\Models\Payment;
use App\Services\Payments\Gateways\MoyasarGateway;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class MoyasarCheckoutSafetyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config()->set('services.moyasar.mode', 'test');
        config()->set('services.moyasar.secret_key', 'sk_test_unit_only');
        config()->set('services.moyasar.publishable_key', 'pk_test_unit_only');
        config()->set('services.moyasar.base_url', 'https://api.moyasar.com/v1');
        config()->set('services.moyasar.callback_url', 'https://numayr.net/payment/callback');
    }

    private function payment(string $amount, string $currency = 'SAR'): Payment
    {
        $payment = new Payment();
        $payment->id = 42;
        $payment->amount = $amount;
        $payment->currency = $currency;

        return $payment;
    }

    public function test_it_converts_two_decimal_riyals_into_integer_halalas(): void
    {
        Http::fake([
            'api.moyasar.com/v1/payment_intents' => Http::response([
                'id' => 'intent_test_1',
                'client_secret' => 'intent_secret_test',
                'expires_at' => '2030-01-01T00:00:00Z',
            ], 200),
        ]);

        $result = app(MoyasarGateway::class)->createPayment($this->payment('10.25'));

        $this->assertSame('intent_test_1', $result['reference']);
        Http::assertSent(function ($request) {
            return $request->method() === 'POST'
                && $request->url() === 'https://api.moyasar.com/v1/payment_intents'
                && $request['amount'] === 1025
                && $request['currency'] === 'SAR';
        });
    }

    public function test_it_rejects_non_sar_payments_without_contacting_provider(): void
    {
        Http::fake();
        $this->expectException(RuntimeException::class);

        try {
            app(MoyasarGateway::class)->createPayment($this->payment('10.00', 'USD'));
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_it_rejects_prices_below_one_riyal_without_contacting_provider(): void
    {
        Http::fake();
        $this->expectException(RuntimeException::class);

        try {
            app(MoyasarGateway::class)->createPayment($this->payment('0.99'));
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_it_rejects_a_live_secret_in_test_mode_without_contacting_provider(): void
    {
        config()->set('services.moyasar.secret_key', 'sk_live_wrong_environment');
        Http::fake();
        $this->expectException(RuntimeException::class);

        try {
            app(MoyasarGateway::class)->createPayment($this->payment('10.00'));
        } finally {
            Http::assertNothingSent();
        }
    }
}
