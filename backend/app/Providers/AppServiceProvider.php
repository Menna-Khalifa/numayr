<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('auth-login', function (Request $request) {
            return Limit::perMinute(5)->by(
                strtolower(trim((string) $request->input('email'))).'|'.$request->ip()
            );
        });

        RateLimiter::for('auth-register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('payment-webhook', function (Request $request) {
            return Limit::perMinute(60)->by(
                (string) $request->route('provider').'|'.$request->ip()
            );
        });

        RateLimiter::for('password-forgot', function (Request $request) {
            $phone = \App\Support\SaudiPhone::normalize(
                (string) $request->input('phone', '')
            ) ?? trim((string) $request->input('phone'));

            return [
                Limit::perMinute(3)->by('otp-forgot-pair:'.$phone.'|'.$request->ip()),
                Limit::perHour(6)->by('otp-phone:'.$phone),
                Limit::perMinute(10)->by('otp-forgot-ip:'.$request->ip()),
            ];
        });

        RateLimiter::for('password-verify', function (Request $request) {
            $phone = \App\Support\SaudiPhone::normalize(
                (string) $request->input('phone', '')
            ) ?? trim((string) $request->input('phone'));

            return [
                Limit::perMinute(5)->by('otp-verify-pair:'.$phone.'|'.$request->ip()),
                Limit::perHour(15)->by('otp-verify-phone:'.$phone),
                Limit::perMinute(20)->by('otp-verify-ip:'.$request->ip()),
            ];
        });
        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
