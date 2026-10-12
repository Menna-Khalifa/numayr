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
    public function test_international_and_local_phone_share_otp_rate_limit(): void
    {
        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '0551234567',
        ])->assertOk();

        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '+966551234567',
        ])->assertOk();

        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '966551234567',
        ])->assertOk();

        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '00966551234567',
        ])->assertStatus(429);
    }
    public function test_changing_ip_cannot_bypass_phone_hourly_otp_limit(): void
    {
        $formats = [
            '0551234567',
            '+966551234567',
            '966551234567',
            '00966551234567',
            '551234567',
            '055 123 4567',
        ];

        foreach ($formats as $index => $phone) {
            $this->withServerVariables([
                'REMOTE_ADDR' => '198.51.100.'.($index + 10),
            ])->postJson('/api/v1/auth/password/forgot', [
                'phone' => $phone,
            ])->assertOk();
        }

        $this->withServerVariables([
            'REMOTE_ADDR' => '198.51.100.99',
        ])->postJson('/api/v1/auth/password/forgot', [
            'phone' => '+966551234567',
        ])->assertStatus(429);
    }
}
