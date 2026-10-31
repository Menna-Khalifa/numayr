<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Database\Seeders\SystemSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseOneServiceJourneyTest extends TestCase
{
    use RefreshDatabase;

    private function fixtures(): array
    {
        $this->seed(ServiceSeeder::class);
        $this->seed(SystemSettingSeeder::class);
        $customer = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $address = $customer->addresses()->create(['label' => 'المنزل', 'city' => 'Riyadh', 'is_default' => true]);
        $cooler = $customer->coolers()->create([
            'name' => 'برادة المنزل',
            'address_id' => $address->id,
            'water_source' => 'network',
            'approval_status' => 'approved',
            'is_active' => true,
        ]);
        return compact('customer', 'admin', 'address', 'cooler');
    }

    public function test_refill_service_creates_a_priced_order_and_customer_can_cancel(): void
    {
        extract($this->fixtures());
        $this->actingAs($customer);
        $response = $this->postJson('/api/v1/orders', [
            'service_code' => 'water_refill',
            'cooler_id' => $cooler->id,
            'address_id' => $address->id,
            'quantity' => 500,
            'priority' => 'standard',
            'preferred_date' => now()->toDateString(),
        ])->assertCreated()->assertJsonPath('data.order.status', 'pending');
        $id = $response->json('data.order.id');
        $this->assertEquals(25.00, (float) Order::findOrFail($id)->subtotal);
        $this->assertEquals(28.75, (float) Order::findOrFail($id)->total_amount);

        $this->patchJson("/api/v1/orders/{$id}/cancel", ['reason' => 'إلغاء تجريبي'])
            ->assertOk()->assertJsonPath('data.order.status', 'cancelled');
        $this->assertDatabaseHas('orders', ['id' => $id, 'status' => 'cancelled']);
    }

    public function test_filter_change_uses_selected_option_price_not_base_price(): void
    {
        extract($this->fixtures());
        $this->actingAs($customer);
        $response = $this->postJson('/api/v1/orders', [
            'service_code' => 'filter_change',
            'cooler_id' => $cooler->id,
            'address_id' => $address->id,
            'service_data' => ['option_code' => 'ro_membrane'],
        ])->assertCreated();
        $order = Order::findOrFail($response->json('data.order.id'));
        $this->assertEquals(140.00, (float) $order->subtotal);
        $this->assertSame('ro_membrane', $order->service_data['option_snapshot']['code']);
    }

    public function test_maintenance_quote_reaches_customer_approval(): void
    {
        extract($this->fixtures());
        $this->actingAs($customer);
        $response = $this->postJson('/api/v1/orders', [
            'service_code' => 'maintenance',
            'cooler_id' => $cooler->id,
            'address_id' => $address->id,
            'service_data' => ['issue_type' => 'تسرّب مياه', 'description' => 'تسرب من الصنبور'],
        ])->assertCreated();
        $id = $response->json('data.order.id');
        $this->assertSame(Order::QUOTE_STATUS_AWAITING_INSPECTION, Order::findOrFail($id)->quote_status);
        $this->actingAs($admin)->postJson("/api/v1/admin/orders/{$id}/quote", [
            'quote_subtotal' => 100,
            'quote_notes' => 'تكلفة الصيانة بعد المعاينة',
        ])->assertOk();
        $this->actingAs($customer)->postJson("/api/v1/orders/{$id}/quote/approve")
            ->assertOk();
        $this->assertSame(Order::QUOTE_STATUS_APPROVED, Order::findOrFail($id)->quote_status);
    }

    public function test_zero_cost_order_transitions_and_updates_cooler(): void
    {
        extract($this->fixtures());
        Service::query()->where('code', 'water_refill')->update(['unit_price' => 0]);
        $this->actingAs($customer);
        $created = $this->postJson('/api/v1/orders', [
            'service_code' => 'water_refill', 'cooler_id' => $cooler->id,
            'address_id' => $address->id, 'quantity' => 500,
        ])->assertCreated();
        $id = $created->json('data.order.id');
        $this->actingAs($admin);
        foreach (['confirmed', 'in_progress', 'completed'] as $status) {
            $this->patchJson('/api/v1/admin/orders/'.$id.'/transition', ['status' => $status])
                ->assertOk()->assertJsonPath('data.order.status', $status);
        }
        $this->assertNotNull($cooler->fresh()->last_refill_at);
        $this->actingAs($customer)->getJson('/api/v1/orders/'.$id)
            ->assertOk()->assertJsonPath('data.order.status', 'completed');
    }

    public function test_order_date_limits_match_the_service_booking_rules(): void
    {
        extract($this->fixtures());
        $this->actingAs($customer);
        $basic = [
            'service_code' => 'water_refill',
            'cooler_id' => $cooler->id,
            'address_id' => $address->id,
            'quantity' => 500,
        ];
        $this->postJson('/api/v1/orders', array_merge($basic, [
            'priority' => 'standard',
            'preferred_date' => now()->addDays(3)->toDateString(),
        ]))->assertUnprocessable()->assertJsonValidationErrors('preferred_date');
        $this->postJson('/api/v1/orders', array_merge($basic, [
            'priority' => 'urgent',
            'preferred_date' => now()->addDay()->toDateString(),
        ]))->assertUnprocessable()->assertJsonValidationErrors('preferred_date');
    }
}
