<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ProfileSaudiPhoneTest extends TestCase
{
    use DatabaseTransactions;

    private function customer(string $email = 'phone-profile-customer@example.test'): User
    {
        return User::create([
            'name' => 'Phone Profile Customer',
            'email' => $email,
            'phone' => null,
            'role' => 'customer',
            'is_active' => true,
            'password' => 'not-a-real-password',
        ]);
    }

    public function test_profile_rejects_invalid_saudi_mobile(): void
    {
        $customer = $this->customer();
        $this->actingAs($customer)
            ->putJson('/api/v1/profile', ['name' => 'Test Customer', 'phone' => '123456'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('phone');
    }

    public function test_profile_normalizes_and_persists_saudi_mobile(): void
    {
        $customer = $this->customer();

        $this->actingAs($customer)
            ->putJson('/api/v1/profile', ['phone' => '+966501234567'])
            ->assertOk()
            ->assertJsonPath('data.user.phone', '0501234567');

        $this->assertDatabaseHas('users', [
            'id' => $customer->id,
            'phone' => '0501234567',
        ]);
        $this->actingAs($customer)
            ->getJson('/api/v1/profile')
            ->assertOk()
            ->assertJsonPath('data.user.phone', '0501234567');
    }

    public function test_profile_rejects_phone_already_held_in_international_format(): void
    {
        $customer = $this->customer();
        User::create([
            'name' => 'Existing user',
            'email' => 'phone-existing-user@example.test',
            'phone' => '+966501234567',
            'role' => 'customer',
            'is_active' => true,
            'password' => 'not-a-real-password',
        ]);

        $this->actingAs($customer)
            ->putJson('/api/v1/profile', ['phone' => '0501234567'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('phone');
    }
}
