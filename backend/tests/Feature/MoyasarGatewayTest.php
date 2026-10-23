<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Services\Payments\Gateways\MoyasarGateway;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class MoyasarGatewayTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.moyasar.secret_key', 'sk_test_example');
        config()->set('services.moyasar.callback_url', 'https://example.com/payment/callback');
        config()->set('services.moyasar.base_url', 'https://api.moyasar.com/v1');
        Http::preventStrayRequests();
    }

    public function test_creates_intent_with_amount_in_halalas_and_server_secret(): void
    {
        Http::fake([
            'api.moyasar.com/*' => Http::response([
                'id' => 'pi_test_123',
                'client_secret' => 'client_secret_test',
                'expires_at' => '2026-10-23T16:00:00Z',
            ], 201),
        ]);

        $payment = new Payment();
        $payment->id = 42;
        $payment->amount = '15.75';
        $payment->currency = 'SAR';

        $result = app(MoyasarGateway::class)->createPayment($payment);

        $this->assertSame('pi_test_123', $result['reference']);
        $this->assertSame('client_secret_test', $result['client_secret']);
        Http::assertSent(function (Request $request) {
            return $request->method() === 'POST'
                && $request->url() === 'https://api.moyasar.com/v1/payment_intents'
                && $request['amount'] === 1575
                && $request['currency'] === 'SAR'
                && $request['callback_url'] === 'https://example.com/payment/callback'
                && $request->hasHeader('Authorization', 'Basic '.base64_encode('sk_test_example:'));
        });
        Http::assertSentCount(1);
    }

    public function test_missing_secret_key_blocks_payment_without_http_request(): void
    {
        config()->set('services.moyasar.secret_key', null);
        Http::fake();

        $payment = new Payment();
        $payment->id = 42;
        $payment->amount = '15.75';
        $payment->currency = 'SAR';

        try {
            app(MoyasarGateway::class)->createPayment($payment);
            $this->fail('Expected missing key to be rejected.');
        } catch (RuntimeException $exception) {
            $this->assertSame('Moyasar secret key is not configured.', $exception->getMessage());
        }

        Http::assertNothingSent();
    }

    public function test_webhook_requires_matching_configured_shared_secret(): void
    {
        $gateway = app(MoyasarGateway::class);
        config()->set('services.moyasar.webhook_secret', 'secure-test-token');

        $this->assertTrue($gateway->verifyWebhookSignature(
            json_encode(['secret_token' => 'secure-test-token', 'data' => ['id' => 'p1']]),
            null
        ));
        $this->assertFalse($gateway->verifyWebhookSignature(
            json_encode(['secret_token' => 'wrong-token']),
            null
        ));
        $this->assertFalse($gateway->verifyWebhookSignature('{}', null));
        $this->assertFalse($gateway->verifyWebhookSignature('invalid json', null));

        config()->set('services.moyasar.webhook_secret', null);
        $this->assertFalse($gateway->verifyWebhookSignature(
            json_encode(['secret_token' => 'secure-test-token']),
            null
        ));
    }

    public function test_verify_payment_rejects_unexpected_reference(): void
    {
        Http::fake([
            'api.moyasar.com/*' => Http::response([
                'id' => 'different_reference',
                'status' => 'paid',
            ], 200),
        ]);

        $this->expectException(RuntimeException::class);
        app(MoyasarGateway::class)->verifyPayment('requested_reference');
    }
}
