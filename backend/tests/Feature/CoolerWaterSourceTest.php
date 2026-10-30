<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CoolerWaterSourceTest extends TestCase
{
    use DatabaseTransactions;

    private function customer(): User
    {
        return User::create([
            'name' => 'Cooler Test Customer',
            'email' => 'cooler-source-test@example.test',
            'phone' => '0501234567',
            'role' => 'customer',
            'is_active' => true,
            'password' => 'not-a-real-password',
        ]);
    }

    public function test_new_cooler_requires_water_source(): void
    {
        $this->actingAs($this->customer())
            ->postJson('/api/v1/coolers', ['name' => 'Sample cooler'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('water_source');
    }

    public function test_tanker_requires_positive_capacity(): void
    {
        $this->actingAs($this->customer())
            ->postJson('/api/v1/coolers', [
                'name' => 'Sample cooler',
                'water_source' => 'tanker',
                'tank_capacity_liters' => 0,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('tank_capacity_liters');
    }

    public function test_network_source_is_saved_without_capacity(): void
    {
        $customer = $this->customer();

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/coolers', [
                'name' => 'Sample cooler',
                'water_source' => 'network',
            ])->assertCreated();

        $this->assertDatabaseHas('coolers', [
            'id' => $response->json('data.cooler.id'),
            'user_id' => $customer->id,
            'water_source' => 'network',
            'tank_capacity_liters' => null,
            'approval_status' => 'pending_review',
        ]);
    }

    public function test_tanker_capacity_is_saved(): void
    {
        $customer = $this->customer();

        $response = $this->actingAs($customer)
            ->postJson('/api/v1/coolers', [
                'name' => 'Sample cooler',
                'water_source' => 'tanker',
                'tank_capacity_liters' => 1200,
            ])->assertCreated();

        $this->assertDatabaseHas('coolers', [
            'id' => $response->json('data.cooler.id'),
            'user_id' => $customer->id,
            'water_source' => 'tanker',
            'tank_capacity_liters' => 1200,
        ]);
    }
}
