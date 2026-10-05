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
            return Limit::perMinute(3)->by(
                trim((string) $request->input('phone')).'|'.$request->ip()
            );
        });

        RateLimiter::for('password-verify', function (Request $request) {
            return Limit::perMinute(5)->by(
                trim((string) $request->input('phone')).'|'.$request->ip()
            );
        });

        RateLimiter::for('password-reset', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
