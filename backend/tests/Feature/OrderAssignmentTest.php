<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private function user(
        string $role = 'customer',
        bool $active = true
    ): User {
        return User::factory()->create([
            'role' => $role,
            'is_active' => $active,
        ]);
    }

    private function order(
        User $customer,
        string $status = Order::STATUS_PENDING
    ): Order {
        return Order::create([
            'order_number' => 'TEST-' . uniqid(),
            'user_id' => $customer->id,
            'service_code' => 'maintenance',
            'service_name' => 'Maintenance',
            'pricing_model' => 'fixed',
            'status' => $status,
            'payment_status' => 'pending',
        ]);
    }

    private function url(Order $order): string
    {
        return "/api/v1/admin/orders/{$order->id}/assign";
    }

    public function test_admin_can_assign_active_technician(): void
    {
        $admin = $this->user('admin');
        $customer = $this->user();
        $technician = $this->user('technician');

        $order = $this->order($customer);

        Sanctum::actingAs($admin);

        $this->postJson($this->url($order), [
            'technician_id' => $technician->id,
        ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath(
                'data.order.technician_id',
                $technician->id
            );

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'technician_id' => $technician->id,
            'status' => Order::STATUS_PENDING,
        ]);
    }

    public function test_admin_can_assign_confirmed_order(): void
    {
        $admin = $this->user('admin');
        $customer = $this->user();
        $technician = $this->user('technician');

        $order = $this->order(
            $customer,
            Order::STATUS_CONFIRMED
        );

        Sanctum::actingAs($admin);

        $this->postJson($this->url($order), [
            'technician_id' => $technician->id,
        ])->assertOk();

        $this->assertSame(
            $technician->id,
            $order->fresh()->technician_id
        );
    }

    public function test_admin_can_reassign_before_work_starts(): void
    {
        $admin = $this->user('admin');
        $customer = $this->user();
        $first = $this->user('technician');
        $second = $this->user('technician');

        $order = $this->order($customer);

        Sanctum::actingAs($admin);

        $this->postJson($this->url($order), [
            'technician_id' => $first->id,
        ])->assertOk();

        $this->postJson($this->url($order), [
            'technician_id' => $second->id,
        ])->assertOk();

        $this->assertSame(
            $second->id,
            $order->fresh()->technician_id
        );
    }

    public function test_customer_and_technician_cannot_assign(): void
    {
        $customer = $this->user();
        $technician = $this->user('technician');

        $order = $this->order($customer);

        foreach ([$customer, $technician] as $actor) {
            Sanctum::actingAs($actor);

            $this->postJson($this->url($order), [
                'technician_id' => $technician->id,
            ])->assertForbidden();
        }

        $this->assertNull(
            $order->fresh()->technician_id
        );
    }

    public function test_inactive_technician_and_customer_are_invalid(): void
    {
        $admin = $this->user('admin');
        $customer = $this->user();
        $inactive = $this->user('technician', false);

        $order = $this->order($customer);

        Sanctum::actingAs($admin);

        foreach ([$inactive->id, $customer->id] as $id) {
            $this->postJson($this->url($order), [
                'technician_id' => $id,
            ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('technician_id');
        }

        $this->assertNull(
            $order->fresh()->technician_id
        );
    }

    public function test_started_and_final_orders_cannot_be_assigned(): void
    {
        $admin = $this->user('admin');
        $customer = $this->user();
        $technician = $this->user('technician');

        Sanctum::actingAs($admin);

        foreach ([
            Order::STATUS_IN_PROGRESS,
            Order::STATUS_COMPLETED,
            Order::STATUS_CANCELLED,
        ] as $status) {
            $order = $this->order($customer, $status);

            $this->postJson($this->url($order), [
                'technician_id' => $technician->id,
            ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors('order');

            $this->assertNull(
                $order->fresh()->technician_id
            );
        }
    }

    public function test_assigning_same_technician_twice_is_safe(): void
    {
        $admin = $this->user('admin');
        $customer = $this->user();
        $technician = $this->user('technician');

        $order = $this->order($customer);

        Sanctum::actingAs($admin);

        for ($i = 0; $i < 2; $i++) {
            $this->postJson($this->url($order), [
                'technician_id' => $technician->id,
            ])->assertOk();
        }

        $this->assertSame(
            $technician->id,
            $order->fresh()->technician_id
        );
    }
}