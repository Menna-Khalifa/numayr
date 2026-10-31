<?php

namespace Tests\Feature;

use App\Services\Sms\SmsService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Tests\TestCase;

class SmsDriverTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Http::preventStrayRequests();

        config()->set('services.authentica.api_key', 'fake-test-key');
        config()->set(
            'services.authentica.base_url',
            'https://api.authentica.sa'
        );
    }

    public function test_log_driver_does_not_call_authentica(): void
    {
        config()->set('services.sms.driver', 'log');

        Http::fake();
        Log::spy();

        app(SmsService::class)->sendOtp('0501234567', '1234');

        Http::assertNothingSent();
        Log::shouldHaveReceived('info')->once();
    }

    public function test_authentica_driver_sends_one_request(): void
    {
        config()->set('services.sms.driver', 'authentica');

        Http::fake([
            'api.authentica.sa/*' =>
                Http::response(['success' => true], 200),
        ]);

        app(SmsService::class)->sendOtp('0501234567', '1234');

        Http::assertSentCount(1);

        Http::assertSent(function (Request $request) {
            return $request['otp'] === '1234'
                && $request['phone'] === '+966501234567';
        });
    }

    public function test_authentica_failure_does_not_fallback_to_log(): void
    {
        config()->set('services.sms.driver', 'authentica');

        Http::fake([
            'api.authentica.sa/*' =>
                Http::response(['success' => false], 500),
        ]);

        Log::spy();

        $this->expectException(RuntimeException::class);

        try {
            app(SmsService::class)->sendOtp(
                '0501234567',
                '1234'
            );
        } finally {
            Http::assertSentCount(1);
            Log::shouldNotHaveReceived('info');
        }
    }

    public function test_authentica_sends_transactional_sms(): void
    {
        config()->set('services.sms.driver', 'authentica');
        config()->set('services.sms.from', 'NUMAYR');
        Http::fake(['api.authentica.sa/*' => Http::response(['success' => true], 200)]);

        app(SmsService::class)->send('0501234567', 'تم تأكيد طلبك');

        Http::assertSentCount(1);
        Http::assertSent(fn (Request $request) =>
            $request->url() === 'https://api.authentica.sa/api/v2/send-sms'
            && $request['phone'] === '+966501234567'
            && $request['sender_name'] === 'NUMAYR'
            && $request['message'] === 'تم تأكيد طلبك'
        );
    }

    public function test_transactional_sms_failure_is_detected(): void
    {
        config()->set('services.sms.driver', 'authentica');
        config()->set('services.sms.from', 'NUMAYR');
        Http::fake(['api.authentica.sa/*' => Http::response(['success' => false], 200)]);
        $this->expectException(RuntimeException::class);
        app(SmsService::class)->send('0501234567', 'رسالة اختبار');
    }

    public function test_unknown_driver_is_rejected(): void
    {
        config()->set('services.sms.driver', 'unknown');

        Http::fake();

        $this->expectException(RuntimeException::class);

        try {
            app(SmsService::class)->sendOtp(
                '0501234567',
                '1234'
            );
        } finally {
            Http::assertNothingSent();
        }
    }
}