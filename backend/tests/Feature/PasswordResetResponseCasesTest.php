<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class PasswordResetResponseCasesTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_response_is_identical_across_account_states(): void
    {
        $active = User::factory()->create([
            'phone' => '0551234567',
            'is_active' => true,
        ]);

        $inactive = User::factory()->create([
            'phone' => '0559876543',
            'is_active' => false,
        ]);

        $sms = Mockery::mock(SmsService::class);

        $sms->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($phone, $otp) use ($active) {
                return $phone === $active->phone
                    && preg_match('/^[0-9]{4}$/', $otp) === 1;
            });

        $this->app->instance(SmsService::class, $sms);

        $url = '/api/v1/auth/password/forgot';

        $first = $this->postJson($url, [
            'phone' => $active->phone,
        ])->assertOk()->json();

        $cooldown = $this->postJson($url, [
            'phone' => $active->phone,
        ])->assertOk()->json();

        $unknown = $this->postJson($url, [
            'phone' => '0559999999',
        ])->assertOk()->json();

        $inactiveResponse = $this->postJson($url, [
            'phone' => $inactive->phone,
        ])->assertOk()->json();

        $this->assertSame($first, $cooldown);
        $this->assertSame($first, $unknown);
        $this->assertSame($first, $inactiveResponse);

        $this->assertDatabaseCount('password_reset_otps', 1);
    }
}