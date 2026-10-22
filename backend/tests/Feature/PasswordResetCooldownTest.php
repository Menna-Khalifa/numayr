<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class PasswordResetCooldownTest extends TestCase
{
    use RefreshDatabase;

    public function test_immediate_repeat_does_not_send_new_otp(): void
    {
        $user = User::factory()->create([
            'phone' => '0551234567',
            'is_active' => true,
        ]);

        $sentCodes = [];

        $sms = Mockery::mock(SmsService::class);

        $sms->shouldReceive('sendOtp')
            ->zeroOrMoreTimes()
            ->withArgs(function ($phone, $otp) use (&$sentCodes) {
                $sentCodes[] = $otp;

                return $phone === '0551234567'
                    && preg_match('/^\d{4}$/', $otp) === 1;
            });

        $this->app->instance(SmsService::class, $sms);

        $url = '/api/v1/auth/password/forgot';
        $payload = ['phone' => $user->phone];

        $this->postJson($url, $payload)->assertOk();

        $firstRecord = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'password_reset')
            ->firstOrFail();

        $firstId = $firstRecord->id;
        $firstHash = $firstRecord->otp_hash;

        $this->assertCount(1, $sentCodes);

        $this->postJson($url, $payload)->assertOk();

        $this->assertCount(
            1,
            $sentCodes,
            'An immediate repeat must not send another SMS.'
        );

        $this->assertDatabaseCount('password_reset_otps', 1);

        $record = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'password_reset')
            ->firstOrFail();

        $this->assertSame($firstId, $record->id);
        $this->assertSame($firstHash, $record->otp_hash);
        $this->assertTrue(
            Hash::check($sentCodes[0], $record->otp_hash)
        );
    }
}