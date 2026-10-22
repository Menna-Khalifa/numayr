<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PasswordResetResponsePrivacyTest extends TestCase
{
    use RefreshDatabase;

    public function test_existing_and_unknown_phone_have_same_public_response(): void
    {
        $user = User::factory()->create([
            'phone' => '0551234567',
            'is_active' => true,
        ]);

        $sms = Mockery::mock(SmsService::class);

        $sms->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($phone, $otp) use ($user) {
                return $phone === $user->phone
                    && preg_match('/^[0-9]{4}$/', $otp) === 1;
            });

        $this->app->instance(SmsService::class, $sms);

        $url = '/api/v1/auth/password/forgot';

        $existing = $this->postJson($url, [
            'phone' => $user->phone,
        ])->assertOk()->json();

        $unknown = $this->postJson($url, [
            'phone' => '0559999999',
        ])->assertOk()->json();

        $this->assertSame(
            $existing,
            $unknown,
            'Password reset response must not reveal account existence.'
        );

        $this->assertDatabaseCount('password_reset_otps', 1);
    }
}