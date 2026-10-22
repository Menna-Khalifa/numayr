<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RegistrationResendAuthenticaConnectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_connection_failure_preserves_old_registration_otp(): void
    {
        config()->set('services.sms.driver', 'authentica');
        config()->set('services.authentica.api_key', 'fake-test-key');
        config()->set(
            'services.authentica.base_url',
            'https://api.authentica.sa'
        );

        Http::preventStrayRequests();

        $attempts = 0;

        Http::fake(function () use (&$attempts) {
            $attempts++;

            throw new ConnectionException(
                'Simulated network failure'
            );
        });

        $user = User::factory()->create([
            'phone' => '0551234567',
            'role' => 'customer',
            'is_active' => false,
        ]);

        $oldRecord = PasswordResetOtp::create([
            'user_id' => $user->id,
            'channel' => 'sms',
            'purpose' => 'registration',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        // Make the resend cooldown expire without expiring the OTP.
        $oldRecord->timestamps = false;
        $oldRecord->created_at = now()->subMinutes(2);
        $oldRecord->save();

        $this->withoutExceptionHandling();

        try {
            $this->postJson(
                '/api/v1/auth/register/resend-otp',
                ['phone' => $user->phone]
            );

            $this->fail('Expected connection failure.');
        } catch (ConnectionException $exception) {
            $this->assertSame(
                'Simulated network failure',
                $exception->getMessage()
            );
        }

        $this->assertSame(1, $attempts);

        $this->assertDatabaseHas('password_reset_otps', [
            'id' => $oldRecord->id,
            'user_id' => $user->id,
            'purpose' => 'registration',
            'verified_at' => null,
        ]);

        $this->assertDatabaseCount('password_reset_otps', 1);

        $this->assertTrue(
            Hash::check(
                '1234',
                $oldRecord->fresh()->otp_hash
            )
        );

        $this->assertFalse($user->fresh()->is_active);
    }
}