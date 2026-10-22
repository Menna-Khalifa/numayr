<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerCannotAssignTechnicianTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_supplied_technician_id_is_ignored(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);

        $technician = User::factory()->create([
            'role' => 'technician',
            'is_active' => true,
        ]);

        $address = $customer->addresses()->create([
            'label' => 'Home',
            'city' => 'Riyadh',
            'district' => 'Test District',
            'street' => 'Test Street',
            'is_default' => true,
        ]);

        Service::create([
            'code' => 'assignment_security_test',
            'name_ar' => 'خدمة اختبار أمان الإسناد',
            'name_en' => 'Assignment Security Test',
            'pricing_model' => 'fixed',
            'base_price' => 100,
            'urgent_fee' => 0,
            'requires_cooler' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($customer, 'sanctum');

        $response = $this->postJson('/api/v1/orders', [
            'service_code' => 'assignment_security_test',
            'address_id' => $address->id,
            'technician_id' => $technician->id,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true);

        $orderId = $response->json('data.order.id');

        $this->assertNotNull($orderId);

        $order = Order::findOrFail($orderId);

        $this->assertSame($customer->id, $order->user_id);

        $this->assertNull(
            $order->technician_id,
            'A customer must not assign a technician during order creation.'
        );

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'user_id' => $customer->id,
            'technician_id' => null,
        ]);

        $this->assertSame(
            0,
            $technician->assignedOrders()->count()
        );
    }
}