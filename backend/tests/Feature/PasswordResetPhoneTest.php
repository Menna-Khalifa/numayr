<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class PasswordResetPhoneTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_reset_otp_works_with_international_phone(): void
    {
        $user = User::factory()->create([
            'phone' => '0551234567',
            'is_active' => true,
        ]);

        $otp = null;

        $sms = Mockery::mock(SmsService::class);
        $sms->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($phone, $code) use (&$otp) {
                $otp = $code;

                return $phone === '0551234567';
            });

        $this->app->instance(SmsService::class, $sms);

        $this->postJson('/api/v1/auth/password/forgot', [
            'phone' => '+966551234567',
        ])->assertOk();

        $this->assertNotNull($otp);

        $record = PasswordResetOtp::where('user_id', $user->id)
            ->where('purpose', 'password_reset')
            ->firstOrFail();

        $this->assertTrue(Hash::check($otp, $record->otp_hash));

        $this->postJson('/api/v1/auth/password/verify-otp', [
            'phone' => '+966551234567',
            'otp' => $otp,
        ])->assertOk()
          ->assertJsonStructure(['data' => ['reset_token']]);
    }

    public function test_registration_otp_cannot_reset_password(): void
    {
        $user = User::factory()->create([
            'phone' => '0559876543',
            'is_active' => true,
        ]);

        PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'registration',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $this->postJson('/api/v1/auth/password/verify-otp', [
            'phone' => '0559876543',
            'otp' => '1234',
        ])->assertUnprocessable();
    }
}