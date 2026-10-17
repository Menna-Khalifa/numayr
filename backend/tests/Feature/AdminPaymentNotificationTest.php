<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\Notifications\AdminPaymentNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPaymentNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_payment_alerts_reach_only_active_admins_without_duplicates(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $otherCustomer = User::factory()->create([
            'role' => 'customer',
        ]);

        $adminOne = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $adminTwo = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $inactiveAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-ADMIN-NOTIFY-001',
            'user_id' => $customer->id,
            'service_code' => 'water_refill',
            'service_name' => 'تعبئة مياه',
            'pricing_model' => 'fixed',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Payment::STATUS_PAID,
            'subtotal' => 100,
            'tax_amount' => 15,
            'total_amount' => 115,
            'currency' => 'SAR',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PAID,
            'amount' => 115,
            'currency' => 'SAR',
        ]);

        $service = app(AdminPaymentNotificationService::class);

        $service->notify($payment, Payment::STATUS_PAID);
        $service->notify($payment, Payment::STATUS_PAID);

        foreach ([$adminOne, $adminTwo] as $admin) {
            $notification = Notification::query()
                ->where('user_id', $admin->id)
                ->where('type', 'payment')
                ->sole();

            $this->assertSame('تم استلام دفعة جديدة', $notification->title);
            $this->assertSame($payment->id, $notification->data['payment_id']);
            $this->assertSame($order->id, $notification->data['order_id']);
            $this->assertSame(['in_app'], $notification->channels);
        }

        $this->assertSame(2, Notification::count());

        foreach ([$inactiveAdmin, $customer, $otherCustomer] as $user) {
            $this->assertSame(
                0,
                Notification::where('user_id', $user->id)->count()
            );
        }
    }

    public function test_secondary_failed_payment_does_not_alert_admins_when_order_is_paid(): void
    {
        $customer = User::factory()->create();

        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-ADMIN-NOTIFY-002',
            'user_id' => $customer->id,
            'service_code' => 'water_refill',
            'service_name' => 'تعبئة مياه',
            'pricing_model' => 'fixed',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Payment::STATUS_PAID,
            'subtotal' => 100,
            'tax_amount' => 15,
            'total_amount' => 115,
            'currency' => 'SAR',
        ]);

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_FAILED,
            'amount' => 115,
            'currency' => 'SAR',
        ]);

        app(AdminPaymentNotificationService::class)
            ->notify($payment, Payment::STATUS_FAILED);

        $this->assertSame(
            0,
            Notification::where('user_id', $admin->id)->count()
        );
    }
}