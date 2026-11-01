<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressDependencyTest extends TestCase
{
    use RefreshDatabase;

    public function test_linked_cooler_address_cannot_be_deleted(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $address = $user->addresses()->create(['city' => 'Riyadh', 'is_default' => true]);
        $cooler = $user->coolers()->create(['name' => 'برادة', 'address_id' => $address->id]);

        $this->actingAs($user)
            ->deleteJson('/api/v1/addresses/'.$address->id)
            ->assertUnprocessable()->assertJsonValidationErrors('address');

        $this->assertDatabaseHas('coolers', [
            'id' => $cooler->id,
            'address_id' => $address->id,
        ]);
        $this->assertDatabaseHas('addresses', ['id' => $address->id]);
    }

    public function test_subscription_address_cannot_be_deleted(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $address = $user->addresses()->create(['city' => 'Riyadh']);
        $user->hasMany(\App\Models\Subscription::class)->create([
            'address_id' => $address->id,
            'plan_code' => 'peace_of_mind',
            'plan_name_ar' => 'راحة البال',
            'billing_cycle' => 'monthly',
            'price' => 19,
            'status' => 'active',
        ]);

        $this->actingAs($user)->deleteJson('/api/v1/addresses/'.$address->id)
            ->assertUnprocessable()->assertJsonValidationErrors('address');
        $this->assertDatabaseHas('addresses', ['id' => $address->id]);
    }

    public function test_unlinked_address_is_deleted_and_default_transfers(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $address = $user->addresses()->create(['city' => 'Riyadh', 'is_default' => true]);
        $other = $user->addresses()->create(['city' => 'Jeddah', 'is_default' => false]);

        $this->actingAs($user)->deleteJson('/api/v1/addresses/'.$address->id)->assertOk();
        $this->assertDatabaseMissing('addresses', ['id' => $address->id]);
        $this->assertTrue((bool) $other->fresh()->is_default);
    }
}
