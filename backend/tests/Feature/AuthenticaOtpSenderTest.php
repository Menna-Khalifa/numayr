<?php

namespace Tests\Feature;

use App\Services\Sms\AuthenticaOtpSender;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

class AuthenticaOtpSenderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config()->set(
            'services.authentica.api_key',
            'fake-test-key'
        );

        config()->set(
            'services.authentica.base_url',
            'https://api.authentica.sa'
        );

        Http::preventStrayRequests();
    }

    public function test_sends_custom_otp_with_correct_payload(): void
    {
        Http::fake([
            'api.authentica.sa/*' =>
                Http::response(['success' => true], 200),
        ]);

        app(AuthenticaOtpSender::class)
            ->sendOtp('0501234567', '1234');

        Http::assertSent(function (Request $request) {
            return $request->method() === 'POST'
                && $request->url()
                    === 'https://api.authentica.sa/api/v2/send-otp'
                && $request->hasHeader(
                    'X-Authorization',
                    'fake-test-key'
                )
                && $request['method'] === 'sms'
                && $request['phone'] === '+966501234567'
                && $request['otp'] === '1234';
        });

        Http::assertSentCount(1);
    }


    public function test_uses_configured_http_timeout(): void
    {
        config()->set('services.authentica.timeout', 7);

        Http::fake([
            'api.authentica.sa/*' =>
                Http::response(['success' => true], 200),
        ]);

        app(AuthenticaOtpSender::class)
            ->sendOtp('0501234567', '1234');

        Http::assertSent(function (Request $request) {
            return ($request->options()['timeout'] ?? null) === 7;
        });
    }

    public function test_rejects_missing_api_key(): void
    {
        Http::fake();

        config()->set('services.authentica.api_key', null);

        $this->expectException(RuntimeException::class);

        try {
            app(AuthenticaOtpSender::class)
                ->sendOtp('0501234567', '1234');
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_rejects_invalid_phone(): void
    {
        Http::fake();

        $this->expectException(RuntimeException::class);

        try {
            app(AuthenticaOtpSender::class)
                ->sendOtp('12345', '1234');
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_rejects_invalid_otp(): void
    {
        Http::fake();

        $this->expectException(RuntimeException::class);

        try {
            app(AuthenticaOtpSender::class)
                ->sendOtp('0501234567', '123456');
        } finally {
            Http::assertNothingSent();
        }
    }

    public function test_rejects_failed_http_response(): void
    {
        Http::fake([
            'api.authentica.sa/*' =>
                Http::response(['success' => false], 500),
        ]);

        $this->expectException(RuntimeException::class);

        app(AuthenticaOtpSender::class)
            ->sendOtp('0501234567', '1234');
    }

    public function test_rejects_success_http_with_failed_provider_status(): void
    {
        Http::fake([
            'api.authentica.sa/*' =>
                Http::response(['success' => false], 200),
        ]);

        $this->expectException(RuntimeException::class);

        app(AuthenticaOtpSender::class)
            ->sendOtp('0501234567', '1234');
    }

    public function test_rejects_http_200_without_success_confirmation(): void
    {
        Http::fake([
            'api.authentica.sa/*' =>
                Http::response([], 200),
        ]);

        $this->expectException(RuntimeException::class);

        app(AuthenticaOtpSender::class)
            ->sendOtp('0501234567', '1234');
    }

    public function test_network_failure_does_not_retry(): void
    {
        $attempts = 0;

        Http::fake(function () use (&$attempts) {
            $attempts++;

            throw new \Illuminate\Http\Client\ConnectionException(
                'Simulated network failure'
            );
        });

        try {
            app(AuthenticaOtpSender::class)
                ->sendOtp('0501234567', '1234');

            $this->fail('Expected a connection exception.');
        } catch (\Illuminate\Http\Client\ConnectionException $exception) {
            $this->assertSame(
                'Simulated network failure',
                $exception->getMessage()
            );
        }

        $this->assertSame(1, $attempts);
    }
}