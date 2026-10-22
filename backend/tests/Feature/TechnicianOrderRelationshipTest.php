<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class TechnicianOrderRelationshipTest extends TestCase
{
    use RefreshDatabase;

    public function test_orders_have_nullable_technician_column(): void
    {
        $this->assertTrue(
            Schema::hasColumn('orders', 'technician_id')
        );
    }

    public function test_order_is_unassigned_by_default(): void
    {
        $order = new Order();

        $this->assertNull($order->technician_id);
    }

    public function test_technician_relationships_use_correct_foreign_key(): void
    {
        $order = new Order();
        $technician = new User();

        $this->assertSame(
            'technician_id',
            $order->technician()->getForeignKeyName()
        );

        $this->assertSame(
            'technician_id',
            $technician->assignedOrders()->getForeignKeyName()
        );
    }
}