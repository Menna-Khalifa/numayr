<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthPhoneLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_login_using_saudi_mobile_number(): void
    {
        User::factory()->create([
            'name' => 'Test Customer',
            'email' => 'phone-login-test@example.com',
            'phone' => '0551234567',
            'role' => 'customer',
            'is_active' => true,
            'password' => Hash::make('TestPass123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => '+966551234567',
            'password' => 'TestPass123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.role', 'customer')
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_customer_can_login_using_email(): void
    {
        User::factory()->create([
            'email' => 'email-login-test@example.com',
            'phone' => '0557654321',
            'role' => 'customer',
            'is_active' => true,
            'password' => Hash::make('TestPass123!'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'email-login-test@example.com',
            'password' => 'TestPass123!',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_wrong_password_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'wrong-password-test@example.com',
            'phone' => '0559876543',
            'is_active' => true,
            'password' => Hash::make('TestPass123!'),
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => '0559876543',
            'password' => 'WrongPassword!',
        ])->assertUnprocessable();
    }

    public function test_public_registration_cannot_create_an_admin(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'registration-security-test@example.com',
            'phone' => '0552223344',
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
            'role' => 'admin',
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('users', [
            'email' => 'registration-security-test@example.com',
            'role' => 'customer',
        ]);
    }
    public function test_registration_requires_email_as_well_as_mobile(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Phone Only Customer',
            'phone' => '0553334455',
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('email');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_duplicate_phone_registration_is_rejected(): void
    {
        User::factory()->create([
            'email' => 'existing-phone@example.com',
            'phone' => '0554445566',
        ]);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate Phone',
            'email' => 'duplicate-phone@example.test',
            'phone' => '0554445566',
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('phone');
    }
    public function test_existing_international_phone_blocks_local_registration(): void
    {
        \App\Models\User::factory()->create([
            'phone' => '+966551111222',
            'email' => 'existing-international@example.com',
        ]);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate Saudi Phone',
            'email' => 'duplicate-local@example.test',
            'phone' => '0551111222',
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('phone');

        $this->assertDatabaseCount('users', 1);
    }

    public function test_existing_local_phone_blocks_international_registration(): void
    {
        \App\Models\User::factory()->create([
            'phone' => '0552222333',
            'email' => 'existing-local@example.com',
        ]);

        $this->postJson('/api/v1/auth/register', [
            'name' => 'Duplicate International Phone',
            'email' => 'duplicate-international@example.test',
            'phone' => '966552222333',
            'password' => 'TestPass123!',
            'password_confirmation' => 'TestPass123!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('phone');

        $this->assertDatabaseCount('users', 1);
    }
}