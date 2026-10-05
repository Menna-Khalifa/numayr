<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        RateLimiter::clear('0551111111|127.0.0.1');
        RateLimiter::clear('0552222222|127.0.0.1');
        RateLimiter::clear('0553333333|127.0.0.1');
    }

    public function test_password_forgot_is_limited_per_phone_and_ip(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/password/forgot', [
                'phone' => '0551111111',
            ])->assertOk();
        }

        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '0551111111',
        ])->assertStatus(429);
    }

    public function test_different_phone_does_not_share_password_forgot_limit_on_same_ip(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/password/forgot', [
                'phone' => '0551111111',
            ])->assertOk();
        }

        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '0552222222',
        ])->assertOk();
    }

    public function test_password_verify_is_limited_per_phone_and_ip(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/password/verify-otp', [
                'phone' => '0553333333',
                'otp' => '1234',
            ])->assertStatus(422);
        }

        $this->postJson('/api/v1/auth/password/verify-otp', [
            'phone' => '0553333333',
            'otp' => '1234',
        ])->assertStatus(429);
    }
}
