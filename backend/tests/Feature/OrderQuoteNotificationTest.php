<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderQuoteNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_approval_and_rejection_notify_only_active_admins_without_duplicates(): void
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

        $makeOrder = function (string $number) use ($customer): Order {
            return Order::create([
                'order_number' => $number,
                'user_id' => $customer->id,
                'service_code' => 'quote_test',
                'service_name' => 'خدمة اختبار عرض السعر',
                'pricing_model' => 'quote',
                'status' => Order::STATUS_PENDING,
                'payment_status' => 'pending',
                'quote_status' => Order::QUOTE_STATUS_AWAITING_APPROVAL,
                'quote_subtotal' => 100,
                'quoted_at' => now(),
                'subtotal' => 100,
                'tax_rate' => 0,
                'tax_amount' => 0,
                'total_amount' => 100,
                'currency' => 'SAR',
                'priority' => 'standard',
            ]);
        };

        $approvedOrder = $makeOrder('QUOTE-TEST-APPROVE');
        $rejectedOrder = $makeOrder('QUOTE-TEST-REJECT');

        $this->actingAs($customer, 'sanctum');

        $this->postJson(
            '/api/v1/orders/'.$approvedOrder->id.'/quote/approve'
        )->assertOk();

        $this->postJson(
            '/api/v1/orders/'.$rejectedOrder->id.'/quote/reject'
        )->assertOk();

        $this->assertSame(
            Order::QUOTE_STATUS_APPROVED,
            $approvedOrder->fresh()->quote_status
        );

        $this->assertSame(
            Order::QUOTE_STATUS_REJECTED,
            $rejectedOrder->fresh()->quote_status
        );

        foreach ([$admin, $secondAdmin] as $recipient) {
            $approval = Notification::query()
                ->where('user_id', $recipient->id)
                ->where('title', 'تمت الموافقة على عرض السعر')
                ->sole();

            $rejection = Notification::query()
                ->where('user_id', $recipient->id)
                ->where('title', 'تم رفض عرض السعر')
                ->sole();

            $this->assertSame($approvedOrder->id, $approval->data['order_id']);
            $this->assertSame($rejectedOrder->id, $rejection->data['order_id']);
            $this->assertSame(['in_app'], $approval->channels);
            $this->assertSame(['in_app'], $rejection->channels);
        }

        $this->assertSame(4, Notification::count());

        $this->postJson(
            '/api/v1/orders/'.$approvedOrder->id.'/quote/approve'
        )->assertUnprocessable();

        $this->postJson(
            '/api/v1/orders/'.$rejectedOrder->id.'/quote/reject'
        )->assertUnprocessable();

        $this->assertSame(4, Notification::count());

        $this->assertSame(
            0,
            Notification::where('user_id', $inactiveAdmin->id)->count()
        );

        $this->assertSame(
            0,
            Notification::where('user_id', $otherCustomer->id)->count()
        );

        $this->assertSame(
            0,
            Notification::where('user_id', $customer->id)->count()
        );
    }
}