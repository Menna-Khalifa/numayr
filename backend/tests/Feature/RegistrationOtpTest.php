<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Mockery;
use Tests\TestCase;

class RegistrationOtpTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_must_verify_phone_before_login(): void
    {
        $phone = '0557778899';
        $otp = null;

        $sms = Mockery::mock(SmsService::class);
        $sms->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($sentPhone, $sentOtp) use ($phone, &$otp) {
                $otp = $sentOtp;

                return $sentPhone === $phone && preg_match('/^[0-9]{4}$/', $sentOtp) === 1;
            });

        $this->app->instance(SmsService::class, $sms);

        $registration = $this->postJson('/api/v1/auth/register', [
            'name' => 'Registration Test',
            'email' => 'registration-otp@example.test',
            'phone' => $phone,
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
            'role' => 'admin',
        ]);

        $registration->assertCreated()
            ->assertJsonPath('data.requires_phone_verification', true)
            ->assertJsonMissingPath('data.token');

        $user = User::where('phone', $phone)->firstOrFail();

        $this->assertNull($user->email);
        $this->assertEquals('customer', $user->role);
        $this->assertFalse($user->is_active);
        $this->assertEquals(0, $user->tokens()->count());

        $record = PasswordResetOtp::where('user_id', $user->id)
            ->where('purpose', 'registration')
            ->firstOrFail();

        $this->assertEquals('sms', $record->channel);
        $this->assertTrue(Hash::check($otp, $record->otp_hash));

        $this->postJson('/api/v1/auth/login', [
            'email' => $phone,
            'password' => 'TestPass123!',
        ])->assertUnprocessable();

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $phone,
            'otp' => $otp,
        ])->assertOk()
          ->assertJsonPath('data.user.is_active', true)
          ->assertJsonStructure(['data' => ['token']]);

        $this->assertTrue($user->fresh()->is_active);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $phone,
            'otp' => $otp,
        ])->assertUnprocessable();

        $this->postJson('/api/v1/auth/login', [
            'email' => $phone,
            'password' => 'TestPass123!',
        ])->assertOk();
    }

    public function test_incorrect_registration_otp_is_rejected(): void
    {
        $phone = '0558889900';

        $sms = Mockery::mock(SmsService::class);
        $sms->shouldReceive('sendOtp')->once();

        $this->app->instance(SmsService::class, $sms);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Invalid OTP Test',
            'email' => 'registration-invalid-otp@example.test',
            'phone' => $phone,
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
        ])->assertCreated();

        $user = User::where('phone', $phone)->firstOrFail();

        $record = PasswordResetOtp::where('user_id', $user->id)
            ->where('purpose', 'registration')
            ->firstOrFail();

        $wrongOtp = '0000';

        if (Hash::check($wrongOtp, $record->otp_hash)) {
            $wrongOtp = '9999';
        }

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $phone,
            'otp' => $wrongOtp,
        ])->assertUnprocessable();

        $this->assertFalse($user->fresh()->is_active);
        $this->assertEquals(1, $record->fresh()->attempts);
        $this->assertEquals(0, $user->tokens()->count());
    }
    public function test_expired_registration_otp_is_rejected(): void
    {
        $user = User::factory()->create([
            'phone' => '0551112233',
            'role' => 'customer',
            'is_active' => false,
        ]);

        PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'registration',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->subMinute(),
            'attempts' => 0,
        ]);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => '0551112233',
            'otp' => '1234',
        ])->assertUnprocessable();

        $this->assertFalse($user->fresh()->is_active);
        $this->assertEquals(0, $user->tokens()->count());
    }

    public function test_registration_otp_is_locked_after_five_attempts(): void
    {
        $user = User::factory()->create([
            'phone' => '0552223344',
            'role' => 'customer',
            'is_active' => false,
        ]);

        $record = PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'registration',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 5,
        ]);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => '0552223344',
            'otp' => '1234',
        ])->assertUnprocessable();

        $this->assertFalse($user->fresh()->is_active);
        $this->assertEquals(5, $record->fresh()->attempts);
    }

    public function test_password_reset_otp_cannot_activate_customer(): void
    {
        $user = User::factory()->create([
            'phone' => '0553334456',
            'role' => 'customer',
            'is_active' => false,
        ]);

        PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'password_reset',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => '0553334456',
            'otp' => '1234',
        ])->assertUnprocessable();

        $this->assertFalse($user->fresh()->is_active);
        $this->assertEquals(0, $user->tokens()->count());
    }
    public function test_resending_otp_invalidates_old_code(): void
    {
        $user = User::factory()->create([
            'phone' => '0556667788',
            'role' => 'customer',
            'is_active' => false,
        ]);

        PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'registration',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
            'created_at' => now()->subMinutes(2),
            'updated_at' => now()->subMinutes(2),
        ]);

        PasswordResetOtp::where('user_id', $user->id)
            ->where('purpose', 'registration')
            ->update(['created_at' => now()->subMinutes(2)]);

        $newOtp = null;

        $sms = Mockery::mock(SmsService::class);
        $sms->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($phone, $otp) use (&$newOtp) {
                $newOtp = $otp;

                return $phone === '0556667788';
            });

        $this->app->instance(SmsService::class, $sms);

        $this->postJson('/api/v1/auth/register/resend-otp', [
            'phone' => '0556667788',
        ])->assertOk();

        $this->assertNotNull($newOtp);

        $records = PasswordResetOtp::where('user_id', $user->id)
            ->where('purpose', 'registration')
            ->get();

        $this->assertCount(1, $records);
        $this->assertTrue(Hash::check($newOtp, $records->first()->otp_hash));

        $oldOtp = '1234';

        if ($newOtp === $oldOtp) {
            $this->markTestSkipped('Random OTP matched the old code.');
        }

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => '0556667788',
            'otp' => $oldOtp,
        ])->assertUnprocessable();

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => '0556667788',
            'otp' => $newOtp,
        ])->assertOk();

        $this->assertTrue($user->fresh()->is_active);
    }
    public function test_failed_sms_resend_preserves_old_otp(): void
    {
        $user = User::factory()->create([
            'phone' => '0559998877',
            'role' => 'customer',
            'is_active' => false,
        ]);

        $record = PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'registration',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        PasswordResetOtp::whereKey($record->id)
            ->update(['created_at' => now()->subMinutes(2)]);

        $sms = Mockery::mock(SmsService::class);
        $sms->shouldReceive('sendOtp')
            ->once()
            ->andThrow(new \RuntimeException('SMS provider unavailable'));

        $this->app->instance(SmsService::class, $sms);

        $this->postJson('/api/v1/auth/register/resend-otp', [
            'phone' => $user->phone,
        ])->assertStatus(500);

        $records = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'registration')
            ->get();

        $this->assertCount(1, $records);
        $this->assertEquals($record->id, $records->first()->id);
        $this->assertTrue(Hash::check('1234', $records->first()->otp_hash));
        $this->assertFalse($user->fresh()->is_active);
    }
    public function test_customer_can_register_and_verify_with_international_phone(): void
    {
        $international = '+966551234567';
        $local = '0551234567';
        $otp = null;

        $sms = Mockery::mock(SmsService::class);
        $sms->shouldReceive('sendOtp')
            ->once()
            ->withArgs(function ($phone, $code) use ($local, &$otp) {
                $otp = $code;

                return $phone === $local;
            });

        $this->app->instance(SmsService::class, $sms);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'International Phone Customer',
            'email' => 'registration-international@example.test',
            'phone' => $international,
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
        ])->assertCreated()
          ->assertJsonPath('data.phone', $local)
          ->assertJsonMissingPath('data.token');

        $user = User::where('phone', $local)->firstOrFail();

        $this->assertFalse($user->is_active);
        $this->assertNotNull($otp);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $international,
            'otp' => $otp,
        ])->assertOk()
          ->assertJsonPath('data.user.is_active', true);

        $this->assertTrue($user->fresh()->is_active);
    }
}