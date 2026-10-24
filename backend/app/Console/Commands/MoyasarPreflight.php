<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MoyasarPreflight extends Command
{
    protected $signature = 'payments:preflight {--live : Check for a real-money production launch}';
    protected $description = 'Validate Moyasar payment settings without printing any credentials';

    public function handle(): int
    {
        $live = (bool) $this->option('live');
        $mode = (string) config('services.moyasar.mode', 'test');
        $secret = (string) config('services.moyasar.secret_key', '');
        $publishable = (string) config('services.moyasar.publishable_key', '');
        $callback = (string) config('services.moyasar.callback_url', '');
        $webhookSecret = (string) config('services.moyasar.webhook_secret', '');
        $api = rtrim((string) config('services.moyasar.base_url', ''), '/');

        $checks = [
            'Moyasar provider selected' => config('payments.default') === 'moyasar',
            'Payment mode is valid' => in_array($mode, ['test', 'live'], true),
            'Secret key matches payment mode' => $mode !== ''
                && str_starts_with($secret, 'sk_'.$mode.'_'),
            'Publishable key matches payment mode' => $mode !== ''
                && str_starts_with($publishable, 'pk_'.$mode.'_'),
            'Official Moyasar HTTPS API' => $api === 'https://api.moyasar.com/v1',
            'Callback URL is configured' => filter_var($callback, FILTER_VALIDATE_URL) !== false,
            'Webhook secret configured' => strlen($webhookSecret) >= 16,
        ];

        if ($live) {
            $appUrl = (string) config('app.url', '');
            $checks += [
                'Moyasar live mode selected' => $mode === 'live',
                'Production environment' => app()->environment('production'),
                'Debug disabled' => ! (bool) config('app.debug'),
                'Frontend callback uses HTTPS' => parse_url($callback, PHP_URL_SCHEME) === 'https',
                'Backend URL uses HTTPS' => parse_url($appUrl, PHP_URL_SCHEME) === 'https',
                'Callback is not localhost' => !in_array(
                    strtolower((string) parse_url($callback, PHP_URL_HOST)),
                    ['localhost', '127.0.0.1'], true
                ),
                'Backend is not localhost' => !in_array(
                    strtolower((string) parse_url($appUrl, PHP_URL_HOST)),
                    ['localhost', '127.0.0.1'], true
                ),
                'Callback path is payment callback' =>
                    parse_url($callback, PHP_URL_PATH) === '/payment/callback',
                'Live keys are not obvious placeholders' =>
                    !preg_match('/(example|stub|placeholder|replace|dummy|changeme)/i', $secret.$publishable),
                'Webhook secret is not an obvious placeholder' =>
                    !preg_match('/(example|stub|placeholder|replace|dummy|changeme)/i', $webhookSecret),
            ];
        }

        foreach ($checks as $label => $passed) {
            $this->line(($passed ? '[PASS] ' : '[FAIL] ').$label);
        }

        $failed = count(array_filter($checks, static fn ($passed) => ! $passed));
        if ($failed) {
            $this->error("Payment preflight blocked: {$failed} check(s) failed.");
            return self::FAILURE;
        }

        $this->info('Configuration preflight passed. This is NOT proof that live payments or webhook delivery work.');
        return self::SUCCESS;
    }
}
