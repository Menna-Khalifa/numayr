<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class PasswordResetFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_creates_four_digit_sms_otp_for_active_user(): void
    {
        $user = $this->createUser();

        $capturedOtp = null;

        $smsService = Mockery::mock(SmsService::class);

        $smsService
            ->shouldReceive('sendOtp')
            ->once()
            ->with(
                $user->phone,
                Mockery::on(function ($otp) use (&$capturedOtp) {
                    $capturedOtp = $otp;

                    return is_string($otp)
                        && preg_match('/^\d{4}$/', $otp) === 1;
                })
            );

        $this->app->instance(
            SmsService::class,
            $smsService
        );

        $response = $this->postJson(
            '/api/v1/auth/password/forgot',
            [
                'phone' => $user->phone,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath(
                'data.expires_in_minutes',
                (int) config('services.authentica.otp_ttl_minutes', 5)
            );

        $this->assertNotNull($capturedOtp);

        $otpRecord = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->firstOrFail();

        $this->assertSame(
            'sms',
            $otpRecord->channel
        );

        $this->assertSame(
            0,
            $otpRecord->attempts
        );

        $this->assertTrue(
            Hash::check(
                $capturedOtp,
                $otpRecord->otp_hash
            )
        );

        $this->assertTrue(
            $otpRecord->expires_at->isFuture()
        );
    }

    public function test_forgot_password_does_not_create_otp_for_unknown_phone(): void
    {
        $response = $this->postJson(
            '/api/v1/auth/password/forgot',
            [
                'phone' => '0559999999',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount(
            'password_reset_otps',
            0
        );
    }

    public function test_wrong_otp_increments_attempt_counter(): void
    {
        $user = $this->createUser();

        $otpRecord = $this->createOtp(
            $user,
            '1234'
        );

        $response = $this->postJson(
            '/api/v1/auth/password/verify-otp',
            [
                'phone' => $user->phone,
                'otp' => '9999',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('otp');

        $otpRecord->refresh();

        $this->assertSame(
            1,
            $otpRecord->attempts
        );

        $this->assertNull(
            $otpRecord->verified_at
        );
    }

    public function test_otp_cannot_be_verified_after_five_failed_attempts(): void
    {
        $user = $this->createUser();

        $otpRecord = $this->createOtp(
            $user,
            '1234',
            attempts: 5
        );

        $response = $this->postJson(
            '/api/v1/auth/password/verify-otp',
            [
                'phone' => $user->phone,
                'otp' => '1234',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('otp');

        $otpRecord->refresh();

        $this->assertSame(
            5,
            $otpRecord->attempts
        );

        $this->assertNull(
            $otpRecord->verified_at
        );
    }

    public function test_expired_otp_cannot_be_verified(): void
    {
        $user = $this->createUser();

        $otpRecord = $this->createOtp(
            $user,
            '1234',
            expiresAt: now()->subMinute()
        );

        $response = $this->postJson(
            '/api/v1/auth/password/verify-otp',
            [
                'phone' => $user->phone,
                'otp' => '1234',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('otp');

        $otpRecord->refresh();

        $this->assertNull(
            $otpRecord->verified_at
        );
    }

    public function test_valid_otp_returns_sixty_four_character_reset_token(): void
    {
        $user = $this->createUser();

        $otpRecord = $this->createOtp(
            $user,
            '1234'
        );

        $response = $this->postJson(
            '/api/v1/auth/password/verify-otp',
            [
                'phone' => $user->phone,
                'otp' => '1234',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath(
                'data.expires_in_minutes',
                15
            );

        $resetToken = $response->json(
            'data.reset_token'
        );

        $this->assertIsString(
            $resetToken
        );

        $this->assertSame(
            64,
            strlen($resetToken)
        );

        $otpRecord->refresh();

        $this->assertNotNull(
            $otpRecord->verified_at
        );

        $this->assertSame(
            $user->id,
            Cache::get(
                'password-reset:'.$resetToken
            )
        );
    }

    public function test_invalid_reset_token_cannot_change_password(): void
    {
        $user = $this->createUser();

        $oldPasswordHash = $user->password;

        $response = $this->postJson(
            '/api/v1/auth/password/reset',
            [
                'reset_token' => str_repeat('x', 64),
                'password' => 'NewPassword@2026',
                'password_confirmation' => 'NewPassword@2026',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(
                'reset_token'
            );

        $user->refresh();

        $this->assertSame(
            $oldPasswordHash,
            $user->password
        );
    }

    public function test_password_reset_changes_password_and_revokes_old_tokens(): void
    {
        $user = $this->createUser(
            password: 'OldPassword@2026'
        );

        $user->createToken('first-token');
        $user->createToken('second-token');

        $this->assertDatabaseCount(
            'personal_access_tokens',
            2
        );

        $this->createOtp(
            $user,
            '1234',
            verifiedAt: now()
        );

        $resetToken = str_repeat('a', 64);

        Cache::put(
            'password-reset:'.$resetToken,
            $user->id,
            now()->addMinutes(15)
        );

        $response = $this->postJson(
            '/api/v1/auth/password/reset',
            [
                'reset_token' => $resetToken,
                'password' => 'NewPassword@2026',
                'password_confirmation' => 'NewPassword@2026',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();

        $this->assertTrue(
            Hash::check(
                'NewPassword@2026',
                $user->password
            )
        );

        $this->assertDatabaseCount(
            'personal_access_tokens',
            0
        );

        $this->assertDatabaseMissing(
            'password_reset_otps',
            [
                'user_id' => $user->id,
            ]
        );

        $this->assertNull(
            Cache::get(
                'password-reset:'.$resetToken
            )
        );
    }

    public function test_reset_token_cannot_be_reused_after_successful_password_reset(): void
    {
        $user = $this->createUser();

        $resetToken = str_repeat('b', 64);

        Cache::put(
            'password-reset:'.$resetToken,
            $user->id,
            now()->addMinutes(15)
        );

        $firstResponse = $this->postJson(
            '/api/v1/auth/password/reset',
            [
                'reset_token' => $resetToken,
                'password' => 'FirstPassword@2026',
                'password_confirmation' => 'FirstPassword@2026',
            ]
        );

        $firstResponse->assertOk();

        $secondResponse = $this->postJson(
            '/api/v1/auth/password/reset',
            [
                'reset_token' => $resetToken,
                'password' => 'SecondPassword@2026',
                'password_confirmation' => 'SecondPassword@2026',
            ]
        );

        $secondResponse
            ->assertUnprocessable()
            ->assertJsonValidationErrors(
                'reset_token'
            );

        $user->refresh();

        $this->assertTrue(
            Hash::check(
                'FirstPassword@2026',
                $user->password
            )
        );

        $this->assertFalse(
            Hash::check(
                'SecondPassword@2026',
                $user->password
            )
        );
    }

    public function test_forgot_password_response_should_not_reveal_inactive_account_exists(): void
    {
        $user = $this->createUser(
            isActive: false
        );

        $response = $this->postJson(
            '/api/v1/auth/password/forgot',
            [
                'phone' => $user->phone,
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseCount(
            'password_reset_otps',
            0
        );
    }

    private function createUser(
        bool $isActive = true,
        string $password = 'OldPassword@2026'
    ): User {
        return User::factory()->create([
            'phone' => '055'.fake()->unique()->numerify('#######'),
            'is_active' => $isActive,
            'password' => $password,
        ]);
    }

    private function createOtp(
        User $user,
        string $otp,
        int $attempts = 0,
        $expiresAt = null,
        $verifiedAt = null
    ): PasswordResetOtp {
        return PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'otp_hash' => Hash::make($otp),
            'expires_at' => $expiresAt
                ?? now()->addMinutes(10),
            'verified_at' => $verifiedAt,
            'attempts' => $attempts,
        ]);
    }
}
