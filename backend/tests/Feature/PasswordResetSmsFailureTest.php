<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class PasswordResetSmsFailureTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_sms_preserves_existing_reset_otp(): void
    {
        $user = User::factory()->create([
            'phone' => '0551234567',
            'is_active' => true,
        ]);

        $oldRecord = PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'password_reset',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        // The old OTP is valid, but its resend cooldown has expired.
        $oldRecord->timestamps = false;
        $oldRecord->created_at = now()->subMinutes(2);
        $oldRecord->save();


        $sms = Mockery::mock(SmsService::class);

        $sms->shouldReceive('sendOtp')
            ->once()
            ->andThrow(
                new RuntimeException('Simulated SMS failure')
            );

        $this->app->instance(SmsService::class, $sms);

        try {
            $this->postJson(
                '/api/v1/auth/password/forgot',
                ['phone' => $user->phone]
            );
        } catch (RuntimeException $exception) {
            // The sending failure is expected.
        }

        $this->assertDatabaseHas('password_reset_otps', [
            'id' => $oldRecord->id,
            'user_id' => $user->id,
            'purpose' => 'password_reset',
            'verified_at' => null,
        ]);

        $this->assertDatabaseCount('password_reset_otps', 1);

        $this->assertTrue(
            Hash::check(
                '1234',
                $oldRecord->fresh()->otp_hash
            )
        );
    }
}