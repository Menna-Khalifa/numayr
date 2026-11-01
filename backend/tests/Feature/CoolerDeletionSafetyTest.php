<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoolerDeletionSafetyTest extends TestCase
{
    use RefreshDatabase;

    private function setupCooler(): array
    {
        $user = User::factory()->create(['role' => 'customer']);
        $address = $user->addresses()->create(['city' => 'Riyadh']);
        $cooler = $user->coolers()->create([
            'name' => 'برادة اختبارات',
            'address_id' => $address->id,
            'water_source' => 'network',
            'is_active' => true,
            'approval_status' => 'approved',
        ]);

        return [$user, $cooler, $address];
    }

    public function test_cooler_with_open_order_cannot_be_deleted(): void
    {
        [$user, $cooler, $address] = $this->setupCooler();
        Order::query()->create([
            'order_number' => 'NUM-OPEN-ORDER-1',
            'user_id' => $user->id,
            'cooler_id' => $cooler->id,
            'address_id' => $address->id,
            'service_code' => 'water_refill',
            'service_name' => 'تعبئة المياه',
            'pricing_model' => 'per_unit',
            'status' => 'pending',
        ]);

        $this->actingAs($user)->deleteJson('/api/v1/coolers/'.$cooler->id)
            ->assertUnprocessable()->assertJsonValidationErrors('cooler');
        $this->assertDatabaseHas('coolers', ['id' => $cooler->id]);
    }

    public function test_cooler_with_active_subscription_cannot_be_deleted(): void
    {
        [$user, $cooler, $address] = $this->setupCooler();
        $subscription = Subscription::query()->create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'plan_code' => 'peace_of_mind',
            'plan_name_ar' => 'راحة البال',
            'billing_cycle' => 'monthly',
            'price' => 19,
            'status' => 'active',
        ]);
        $subscription->coolers()->attach($cooler->id);

        $this->actingAs($user)->deleteJson('/api/v1/coolers/'.$cooler->id)
            ->assertUnprocessable()->assertJsonValidationErrors('cooler');
        $this->assertDatabaseHas('coolers', ['id' => $cooler->id]);
        $this->assertDatabaseHas('subscription_cooler', [
            'cooler_id' => $cooler->id,
            'subscription_id' => $subscription->id,
        ]);
    }

    public function test_unused_cooler_can_be_deleted(): void
    {
        [$user, $cooler] = $this->setupCooler();
        $this->actingAs($user)->deleteJson('/api/v1/coolers/'.$cooler->id)->assertOk();
        $this->assertDatabaseMissing('coolers', ['id' => $cooler->id]);
    }
}
