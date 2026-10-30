<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class RegistrationAuthenticaConnectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_connection_rolls_back_new_registration(): void
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

        $phone = '0551234567';

        $this->withoutExceptionHandling();

        try {
            $this->postJson('/api/v1/auth/register', [
                'name' => 'Test Customer',
                'email' => 'authentica-connection@example.test',
                'phone' => $phone,
                'password' => 'TestPass123!',
                'password_confirmation' => 'TestPass123!',
            ]);

            $this->fail('Expected connection failure.');
        } catch (ConnectionException $exception) {
            $this->assertSame(
                'Simulated network failure',
                $exception->getMessage()
            );
        }

        $this->assertSame(1, $attempts);

        $this->assertFalse(
            User::query()->where('phone', $phone)->exists()
        );

        $this->assertDatabaseCount('password_reset_otps', 0);
    }
}