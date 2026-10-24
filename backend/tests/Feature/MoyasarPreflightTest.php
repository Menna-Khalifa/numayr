<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class MoyasarPreflightTest extends TestCase
{
    public function test_preflight_rejects_live_mode_with_test_key(): void
    {
        config()->set('payments.default', 'moyasar');
        config()->set('services.moyasar.mode', 'live');
        config()->set('services.moyasar.secret_key', 'sk_test_stub');
        config()->set('services.moyasar.publishable_key', 'pk_live_stub');
        config()->set('services.moyasar.base_url', 'https://api.moyasar.com/v1');
        config()->set('services.moyasar.callback_url', 'https://numayr.example/payment/callback');
        config()->set('services.moyasar.webhook_secret', 'a-safe-unique-webhook-token');

        $this->assertSame(1, Artisan::call('payments:preflight'));
        $this->assertStringContainsString(
            'Secret key matches payment mode',
            Artisan::output()
        );
        $this->assertStringNotContainsString(
            'sk_test_stub',
            Artisan::output()
        );
    }

    public function test_preflight_accepts_valid_test_config_without_leaking_keys(): void
    {
        config()->set('payments.default', 'moyasar');
        config()->set('services.moyasar.mode', 'test');
        config()->set('services.moyasar.secret_key', 'sk_test_example');
        config()->set('services.moyasar.publishable_key', 'pk_test_example');
        config()->set('services.moyasar.base_url', 'https://api.moyasar.com/v1');
        config()->set('services.moyasar.callback_url', 'http://localhost:3000/payment/callback');
        config()->set('services.moyasar.webhook_secret', 'a-safe-unique-webhook-token');

        $this->assertSame(0, Artisan::call('payments:preflight'));
        $this->assertStringNotContainsString('sk_test_example', Artisan::output());
    }
    public function test_live_preflight_blocks_localhost_and_placeholder_credentials(): void
    {
        config()->set('payments.default', 'moyasar');
        config()->set('services.moyasar.mode', 'live');
        config()->set('services.moyasar.secret_key', 'sk_live_placeholder');
        config()->set('services.moyasar.publishable_key', 'pk_live_placeholder');
        config()->set('services.moyasar.base_url', 'https://api.moyasar.com/v1');
        config()->set('services.moyasar.callback_url', 'https://localhost/payment/callback');
        config()->set('services.moyasar.webhook_secret', 'placeholder-webhook-secret-123456');
        config()->set('app.url', 'https://localhost');

        $this->assertSame(1, Artisan::call('payments:preflight', ['--live' => true]));
        $output = Artisan::output();
        $this->assertStringContainsString('Backend is not localhost', $output);
        $this->assertStringContainsString('Live keys are not obvious placeholders', $output);
        $this->assertStringContainsString('Webhook secret is not an obvious placeholder', $output);
        $this->assertStringNotContainsString('sk_live_placeholder', $output);
    }

}
