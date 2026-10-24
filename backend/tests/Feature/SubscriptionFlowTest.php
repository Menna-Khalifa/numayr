<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Cooler;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('payments.default', 'fake');

        $this->seed(SubscriptionPlanSeeder::class);
    }

    public function test_moyasar_subscription_return_activates_once_after_provider_verification(): void
    {
        Config::set('services.moyasar.mode', 'test');
        Config::set('services.moyasar.secret_key', 'sk_test_stub');
        $user = User::factory()->create();
        [$address, $cooler] = $this->createLocationWithCooler($user);
        $plan = SubscriptionPlan::query()->where('code', 'peace_of_mind')->firstOrFail();
        $subscription = $this->createSubscription($user, $address, $plan, Subscription::STATUS_PENDING);
        $subscription->coolers()->attach($cooler->id);
        $payment = Payment::create([
            'subscription_id' => $subscription->id,
            'provider' => 'moyasar',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => $plan->price,
            'currency' => $plan->currency,
            'provider_reference' => 'intent-sub-01',
        ]);
        $finalId = 'a1111111-1111-4111-8111-111111111111';
        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => $finalId,
                'status' => 'paid',
                'description' => 'NUMAYR Payment #' . $payment->id,
                'amount' => (int) round((float) $plan->price * 100),
                'currency' => $plan->currency,
            ], 200),
        ]);
        Sanctum::actingAs($user);
        $path = "/api/v1/subscriptions/{$subscription->id}/payments/confirm";
        $this->postJson($path, ['provider_payment_id' => $finalId])
            ->assertOk()->assertJsonPath('data.status', Payment::STATUS_PAID);
        $this->assertSame(Subscription::STATUS_ACTIVE, $subscription->fresh()->status);
        $startsAt = $subscription->fresh()->starts_at;
        $this->assertNotNull($startsAt);
        $this->postJson($path, ['provider_payment_id' => $finalId])
            ->assertOk()->assertJsonPath('data.status', Payment::STATUS_PAID);
        $this->assertEquals($startsAt, $subscription->fresh()->starts_at);
    }

    public function test_customer_can_create_subscription_with_payment(): void
    {
        $user = User::factory()->create();

        [$address, $cooler] = $this->createLocationWithCooler($user);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            '/api/v1/subscriptions',
            [
                'plan_code' => 'peace_of_mind',
                'address_id' => $address->id,
                'cooler_ids' => [
                    $cooler->id,
                ],
                'method' => 'card',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.subscription.plan_code',
                'peace_of_mind'
            )
            ->assertJsonPath(
                'data.subscription.status',
                Subscription::STATUS_PENDING
            )
            ->assertJsonPath(
                'data.subscription.address_id',
                $address->id
            )
            ->assertJsonPath(
                'data.subscription.coolers_count',
                1
            )
            ->assertJsonPath(
                'data.payment.status',
                Payment::STATUS_PROCESSING
            );

        $subscription = Subscription::query()
            ->where('user_id', $user->id)
            ->where('address_id', $address->id)
            ->firstOrFail();

        $this->assertSame(
            Subscription::STATUS_PENDING,
            $subscription->status
        );

        $this->assertDatabaseHas('subscription_cooler', [
            'subscription_id' => $subscription->id,
            'cooler_id' => $cooler->id,
        ]);

        $this->assertDatabaseHas('payments', [
            'subscription_id' => $subscription->id,
            'order_id' => null,
            'provider' => 'fake',
            'status' => Payment::STATUS_PROCESSING,
        ]);
    }

    public function test_customer_cannot_create_second_active_or_pending_subscription_for_same_address(): void
    {
        $user = User::factory()->create();

        [$address, $cooler] = $this->createLocationWithCooler($user);

        $plan = SubscriptionPlan::query()
            ->where('code', 'peace_of_mind')
            ->firstOrFail();

        $existing = $this->createSubscription(
            $user,
            $address,
            $plan,
            Subscription::STATUS_ACTIVE
        );

        $existing->coolers()->attach($cooler->id);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            '/api/v1/subscriptions',
            [
                'plan_code' => 'full_care',
                'address_id' => $address->id,
                'cooler_ids' => [
                    $cooler->id,
                ],
                'method' => 'mada',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('subscription');

        $this->assertSame(
            1,
            Subscription::query()
                ->where('user_id', $user->id)
                ->where('address_id', $address->id)
                ->count()
        );
    }

    public function test_customer_cannot_use_cooler_attached_to_another_active_subscription(): void
    {
        $user = User::factory()->create();

        [$addressOne, $cooler] =
            $this->createLocationWithCooler($user);

        $addressTwo = $this->createAddress(
            $user,
            'الموقع الثاني'
        );

        $plan = SubscriptionPlan::query()
            ->where('code', 'peace_of_mind')
            ->firstOrFail();

        $existing = $this->createSubscription(
            $user,
            $addressOne,
            $plan,
            Subscription::STATUS_ACTIVE
        );

        $existing->coolers()->attach($cooler->id);

        $cooler->update([
            'address_id' => $addressTwo->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            '/api/v1/subscriptions',
            [
                'plan_code' => 'full_care',
                'address_id' => $addressTwo->id,
                'cooler_ids' => [
                    $cooler->id,
                ],
                'method' => 'card',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('cooler_ids');

        $this->assertSame(
            1,
            Subscription::query()
                ->where('user_id', $user->id)
                ->count()
        );
    }

    public function test_customer_cannot_subscribe_using_another_users_address_or_cooler(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        [$otherAddress, $otherCooler] =
            $this->createLocationWithCooler($otherUser);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            '/api/v1/subscriptions',
            [
                'plan_code' => 'peace_of_mind',
                'address_id' => $otherAddress->id,
                'cooler_ids' => [
                    $otherCooler->id,
                ],
                'method' => 'card',
            ]
        );

        $response->assertUnprocessable();

        $this->assertDatabaseCount('subscriptions', 0);
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_customer_cannot_view_another_customers_subscription(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        [$address, $cooler] =
            $this->createLocationWithCooler($otherUser);

        $plan = SubscriptionPlan::query()
            ->where('code', 'peace_of_mind')
            ->firstOrFail();

        $subscription = $this->createSubscription(
            $otherUser,
            $address,
            $plan,
            Subscription::STATUS_ACTIVE
        );

        $subscription->coolers()->attach($cooler->id);

        Sanctum::actingAs($owner);

        $this->getJson(
            "/api/v1/subscriptions/{$subscription->id}"
        )->assertNotFound();
    }

    public function test_customer_can_cancel_own_pending_subscription(): void
    {
        $user = User::factory()->create();

        [$address, $cooler] =
            $this->createLocationWithCooler($user);

        $plan = SubscriptionPlan::query()
            ->where('code', 'peace_of_mind')
            ->firstOrFail();

        $subscription = $this->createSubscription(
            $user,
            $address,
            $plan,
            Subscription::STATUS_PENDING
        );

        $subscription->coolers()->attach($cooler->id);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            "/api/v1/subscriptions/{$subscription->id}/cancel"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.subscription.status',
                Subscription::STATUS_CANCELLED
            );

        $subscription->refresh();

        $this->assertSame(
            Subscription::STATUS_CANCELLED,
            $subscription->status
        );

        $this->assertNotNull(
            $subscription->cancelled_at
        );
    }

    public function test_cancelled_subscription_does_not_block_new_subscription_for_same_address(): void
    {
        $user = User::factory()->create();

        [$address, $cooler] =
            $this->createLocationWithCooler($user);

        $plan = SubscriptionPlan::query()
            ->where('code', 'peace_of_mind')
            ->firstOrFail();

        $oldSubscription = $this->createSubscription(
            $user,
            $address,
            $plan,
            Subscription::STATUS_CANCELLED
        );

        $oldSubscription->coolers()->attach($cooler->id);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            '/api/v1/subscriptions',
            [
                'plan_code' => 'full_care',
                'address_id' => $address->id,
                'cooler_ids' => [
                    $cooler->id,
                ],
                'method' => 'mada',
            ]
        );

        $response->assertCreated();

        $this->assertSame(
            2,
            Subscription::query()
                ->where('user_id', $user->id)
                ->where('address_id', $address->id)
                ->count()
        );
    }

    private function createLocationWithCooler(
        User $user
    ): array {
        $address = $this->createAddress(
            $user,
            'المنزل الرئيسي'
        );

        $cooler = Cooler::create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'name' => 'برادة اختبار',
            'status' => 'unknown',
            'is_active' => true,
        ]);

        return [
            $address,
            $cooler,
        ];
    }

    private function createAddress(
        User $user,
        string $label
    ): Address {
        return Address::create([
            'user_id' => $user->id,
            'label' => $label,
            'city' => 'الرياض',
            'district' => 'اختبار',
            'street' => 'شارع اختبار',
            'building' => '1',
            'is_default' => false,
        ]);
    }

    private function createSubscription(
        User $user,
        Address $address,
        SubscriptionPlan $plan,
        string $status
    ): Subscription {
        return Subscription::create([
            'user_id' => $user->id,
            'address_id' => $address->id,
            'coolers_count' => 1,
            'plan_code' => $plan->code,
            'plan_name_ar' => $plan->name_ar,
            'plan_name_en' => $plan->name_en,
            'billing_cycle' => $plan->billing_cycle,
            'price' => $plan->price,
            'currency' => $plan->currency,
            'status' => $status,
            'starts_at' => $status === Subscription::STATUS_ACTIVE
                    ? now()
                    : null,
            'ends_at' => $status === Subscription::STATUS_ACTIVE
                    ? now()->addMonth()
                    : null,
            'cancelled_at' => $status === Subscription::STATUS_CANCELLED
                    ? now()
                    : null,
            'benefits' => $plan->benefits,
            'metadata' => [
                'test' => true,
            ],
        ]);
    }
}
