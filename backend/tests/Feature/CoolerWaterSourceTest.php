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
    public function test_customer_sees_admin_approval_from_the_same_database_record(): void
    {
        $customer = $this->customer();
        $admin = User::create([
            'name' => 'Admin Reviewer',
            'email' => 'reviewer@example.test',
            'role' => 'admin',
            'is_active' => true,
            'password' => 'not-a-real-password',
        ]);

        $created = $this->actingAs($customer)
            ->postJson('/api/v1/coolers', [
                'name' => 'Reviewable cooler',
                'water_source' => 'network',
            ])->assertCreated();
        $id = $created->json('data.cooler.id');

        $this->actingAs($admin)
            ->patchJson("/api/v1/admin/coolers/{$id}/review", [
                'approval_status' => 'approved',
            ])
            ->assertOk()
            ->assertJsonPath('data.cooler.approval_status', 'approved');

        $this->actingAs($customer)
            ->getJson("/api/v1/coolers/{$id}")
            ->assertOk()
            ->assertJsonPath('data.cooler.approval_status', 'approved');
    }

    public function test_customer_can_link_and_update_own_cooler_address(): void
    {
        $customer = $this->customer();
        $first = $customer->addresses()->create(['label' => 'First location', 'city' => 'Riyadh']);
        $second = $customer->addresses()->create(['label' => 'Second location', 'city' => 'Riyadh']);

        $created = $this->actingAs($customer)->postJson('/api/v1/coolers', [
            'name' => 'Address-linked cooler',
            'water_source' => 'network',
            'address_id' => $first->id,
        ])->assertCreated();

        $coolerId = $created->json('data.cooler.id');
        $this->assertDatabaseHas('coolers', ['id' => $coolerId, 'address_id' => $first->id]);

        $this->actingAs($customer)->putJson("/api/v1/coolers/{$coolerId}", [
            'address_id' => $second->id,
        ])->assertOk();

        $this->assertDatabaseHas('coolers', ['id' => $coolerId, 'address_id' => $second->id]);
        $this->actingAs($customer)->getJson("/api/v1/coolers/{$coolerId}")
            ->assertOk()->assertJsonPath('data.cooler.address.id', $second->id);
    }

    public function test_customer_cannot_link_another_customers_address(): void
    {
        $customer = $this->customer();
        $other = User::create([
            'name' => 'Another customer',
            'email' => 'another-cooler-address@example.test',
            'role' => 'customer',
            'is_active' => true,
            'password' => 'not-a-real-password',
        ]);
        $address = $other->addresses()->create(['label' => 'Private', 'city' => 'Jeddah']);

        $this->actingAs($customer)->postJson('/api/v1/coolers', [
            'name' => 'Should not be created',
            'water_source' => 'network',
            'address_id' => $address->id,
        ])->assertStatus(422);
    }

}
