<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cooler;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('payments.default', 'fake');

        $this->seed(SubscriptionPlanSeeder::class);
    }

    public function test_paid_subscription_notifies_customer_once_on_duplicate_webhook(): void
    {
        [$user, $subscription, $payment] = $this->createPendingSubscription();

        $payload = [
            'reference' => $payment->provider_reference,
            'status' => Payment::STATUS_PAID,
            'transaction_id' => 'TX-SUB-NOTIFICATION-PAID',
        ];

        $headers = [
            'X-Webhook-Id' => 'EVENT-SUB-NOTIFICATION-PAID',
        ];

        $this->postJson('/api/v1/payments/webhooks/fake', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $this->assertSame(
            Subscription::STATUS_ACTIVE,
            $subscription->fresh()->status
        );

        $notification = Notification::query()
            ->where('user_id', $user->id)
            ->where('type', 'subscription')
            ->sole();

        $this->assertSame('تم تفعيل اشتراكك', $notification->title);
        $this->assertSame($subscription->id, $notification->data['subscription_id']);
        $this->assertSame($payment->id, $notification->data['payment_id']);
        $this->assertSame(Payment::STATUS_PAID, $notification->data['payment_status']);

        $this->postJson('/api/v1/payments/webhooks/fake', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'subscription')
                ->count()
        );
    }

    public function test_payment_after_subscription_cancellation_does_not_reactivate_it(): void
    {
        [$user, $subscription, $payment] = $this->createPendingSubscription();

        Sanctum::actingAs($user);

        $this->postJson("/api/v1/subscriptions/{$subscription->id}/cancel")
            ->assertOk();

        $this->assertSame(
            Subscription::STATUS_CANCELLED,
            $subscription->fresh()->status
        );

        $payload = [
            'reference' => $payment->provider_reference,
            'status' => Payment::STATUS_PAID,
            'transaction_id' => 'TX-SUB-NOTIFICATION-LATE',
        ];

        $headers = [
            'X-Webhook-Id' => 'EVENT-SUB-NOTIFICATION-LATE',
        ];

        $this->postJson('/api/v1/payments/webhooks/fake', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $this->assertSame(
            Subscription::STATUS_CANCELLED,
            $subscription->fresh()->status
        );

        $this->assertSame(
            Payment::STATUS_PAID,
            $payment->fresh()->status
        );

        $notification = Notification::query()
            ->where('user_id', $user->id)
            ->where('type', 'subscription')
            ->where('data->payment_id', $payment->id)
            ->sole();

        $this->assertSame('تم استلام دفعة الاشتراك', $notification->title);
        $this->assertTrue((bool) $notification->data['activation_skipped']);

        $this->postJson('/api/v1/payments/webhooks/fake', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'subscription')
                ->where('data->payment_id', $payment->id)
                ->count()
        );
    }

    public function test_failed_subscription_payment_notifies_customer_once(): void
    {
        [$user, $subscription, $payment] = $this->createPendingSubscription();

        $payload = [
            'reference' => $payment->provider_reference,
            'status' => Payment::STATUS_FAILED,
            'transaction_id' => 'TX-SUB-FAILED',
        ];

        $headers = [
            'X-Webhook-Id' => 'EVENT-SUB-FAILED',
        ];

        $this->postJson('/api/v1/payments/webhooks/fake', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $this->assertSame(
            Payment::STATUS_FAILED,
            $payment->fresh()->status
        );

        $this->assertSame(
            Subscription::STATUS_CANCELLED,
            $subscription->fresh()->status
        );

        $notification = Notification::query()
            ->where('user_id', $user->id)
            ->where('type', 'subscription')
            ->where('data->payment_id', $payment->id)
            ->sole();

        $this->assertSame('تعذر إتمام دفعة الاشتراك', $notification->title);
        $this->assertSame(
            Payment::STATUS_FAILED,
            $notification->data['payment_status']
        );

        $this->postJson('/api/v1/payments/webhooks/fake', $payload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'subscription')
                ->where('data->payment_id', $payment->id)
                ->count()
        );
    }

    public function test_refunded_subscription_payment_notifies_customer_once(): void
    {
        [$user, $subscription, $payment] = $this->createPendingSubscription();

        $paidPayload = [
            'reference' => $payment->provider_reference,
            'status' => Payment::STATUS_PAID,
            'transaction_id' => 'TX-SUB-REFUND-PAID',
        ];

        $this->postJson(
            '/api/v1/payments/webhooks/fake',
            $paidPayload,
            ['X-Webhook-Id' => 'EVENT-SUB-REFUND-PAID']
        )->assertOk();

        $this->assertSame(
            Subscription::STATUS_ACTIVE,
            $subscription->fresh()->status
        );

        $refundPayload = [
            'reference' => $payment->provider_reference,
            'status' => Payment::STATUS_REFUNDED,
            'transaction_id' => 'TX-SUB-REFUNDED',
        ];

        $headers = [
            'X-Webhook-Id' => 'EVENT-SUB-REFUNDED',
        ];

        $this->postJson('/api/v1/payments/webhooks/fake', $refundPayload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $this->assertSame(
            Payment::STATUS_REFUNDED,
            $payment->fresh()->status
        );

        $this->assertSame(
            Subscription::STATUS_CANCELLED,
            $subscription->fresh()->status
        );

        $notification = Notification::query()
            ->where('user_id', $user->id)
            ->where('type', 'subscription')
            ->where('data->payment_id', $payment->id)
            ->where('data->payment_status', Payment::STATUS_REFUNDED)
            ->sole();

        $this->assertSame('تم استرداد دفعة الاشتراك', $notification->title);

        $this->postJson('/api/v1/payments/webhooks/fake', $refundPayload, $headers)
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'subscription')
                ->where('data->payment_id', $payment->id)
                ->where('data->payment_status', Payment::STATUS_REFUNDED)
                ->count()
        );
    }

    private function createPendingSubscription(): array
    {
        $user = User::factory()->create();

        $address = Address::create([
            'user_id' => $user->id,
            'label' => 'المنزل الرئيسي',
            'city' => 'الرياض',
            'district' => 'اختبار',
            'street' => 'شارع اختبار',
            'building' => '1',
            'is_default' => true,
        ]);

        $cooler = Cooler::create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'name' => 'برادة اختبار',
            'status' => 'unknown',
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/subscriptions', [
            'plan_code' => 'peace_of_mind',
            'address_id' => $address->id,
            'cooler_ids' => [$cooler->id],
            'method' => 'card',
        ])->assertCreated();

        $subscription = Subscription::query()
            ->where('user_id', $user->id)
            ->where('address_id', $address->id)
            ->firstOrFail();

        $payment = Payment::query()
            ->where('subscription_id', $subscription->id)
            ->firstOrFail();

        $this->assertNotEmpty($payment->provider_reference);

        return [$user, $subscription, $payment];
    }
}