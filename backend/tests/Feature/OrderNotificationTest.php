<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_creation_and_cancellation_notify_only_active_admins(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $secondAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $inactiveAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
        ]);

        $customer = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);

        $otherCustomer = User::factory()->create([
            'role' => 'customer',
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
            'code' => 'notification_test_service',
            'name_ar' => 'خدمة اختبار الإشعارات',
            'name_en' => 'Notification Test Service',
            'pricing_model' => 'fixed',
            'base_price' => 100,
            'urgent_fee' => 0,
            'requires_cooler' => false,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->actingAs($customer, 'sanctum');

        $created = $this->postJson('/api/v1/orders', [
            'service_code' => 'notification_test_service',
            'address_id' => $address->id,
        ])->assertCreated();

        $orderId = $created->json('data.order.id');

        $this->assertNotNull($orderId);

        $order = Order::findOrFail($orderId);

        $this->assertSame(Order::STATUS_PENDING, $order->status);

        foreach ([$admin, $secondAdmin] as $recipient) {
            $notification = Notification::query()
                ->where('user_id', $recipient->id)
                ->where('title', 'طلب خدمة جديد')
                ->sole();

            $this->assertSame($order->id, $notification->data['order_id']);
            $this->assertSame($customer->id, $notification->data['customer_id']);
            $this->assertSame(['in_app'], $notification->channels);
        }

        $this->assertSame(0, Notification::where('user_id', $inactiveAdmin->id)->count());
        $this->assertSame(0, Notification::where('user_id', $otherCustomer->id)->count());
        $this->assertSame(0, Notification::where('user_id', $customer->id)->count());

        $this->assertSame(2, Notification::count());

        $this->patchJson('/api/v1/orders/'.$orderId.'/cancel', [
            'reason' => 'Test cancellation',
        ])->assertOk();

        $this->assertSame(
            Order::STATUS_CANCELLED,
            $order->fresh()->status
        );

        foreach ([$admin, $secondAdmin] as $recipient) {
            $notification = Notification::query()
                ->where('user_id', $recipient->id)
                ->where('title', 'تم إلغاء طلب خدمة')
                ->sole();

            $this->assertSame($order->id, $notification->data['order_id']);
            $this->assertSame('Test cancellation', $notification->data['reason']);
            $this->assertSame(['in_app'], $notification->channels);
        }

        $this->assertSame(4, Notification::count());

        $this->patchJson('/api/v1/orders/'.$orderId.'/cancel', [
            'reason' => 'Duplicate cancellation',
        ])->assertUnprocessable();

        $this->assertSame(4, Notification::count());
        $this->assertSame(0, Notification::where('user_id', $inactiveAdmin->id)->count());
        $this->assertSame(0, Notification::where('user_id', $otherCustomer->id)->count());
    }
}