<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaymentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('payments.default', 'fake');
    }

    public function test_customer_can_create_payment_attempt_for_owned_order(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder($user);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            "/api/v1/orders/{$order->id}/payments",
            [
                'method' => 'card',
            ]
        );

        $response
            ->assertCreated()
            ->assertJsonPath(
                'data.payment.order_id',
                $order->id
            )
            ->assertJsonPath(
                'data.payment.status',
                Payment::STATUS_PROCESSING
            )
            ->assertJsonPath(
                'data.payment.amount',
                '115.00'
            );

        $this->assertDatabaseCount('payments', 1);

        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'provider' => 'fake',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => Payment::STATUS_PROCESSING,
        ]);
    }

    public function test_moyasar_checkout_credentials_are_returned_only_in_creation_response(): void
    {
        \Illuminate\Support\Facades\Config::set('payments.default', 'moyasar');
        \Illuminate\Support\Facades\Config::set('services.moyasar.secret_key', 'sk_test_stub');
        \Illuminate\Support\Facades\Config::set('services.moyasar.publishable_key', 'pk_test_stub');
        \Illuminate\Support\Facades\Config::set('services.moyasar.callback_url', 'https://example.test/payment/callback');

        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => 'intent_test_owner',
                'client_secret' => 'pi_secret_private_example',
                'expires_at' => '2026-10-25T16:00:00Z',
            ], 201),
        ]);

        $user = User::factory()->create();
        $order = $this->createOrder($user);
        Sanctum::actingAs($user);

        $this->postJson("/api/v1/orders/{$order->id}/payments", ['method' => 'card'])
            ->assertCreated()
            ->assertJsonPath('data.checkout.intent_id', 'intent_test_owner')
            ->assertJsonPath('data.checkout.client_secret', 'pi_secret_private_example')
            ->assertJsonPath('data.checkout.publishable_key', 'pk_test_stub');

        $payment = Payment::query()->where('order_id', $order->id)->firstOrFail();
        $this->assertStringNotContainsString(
            'pi_secret_private_example',
            json_encode($payment->toArray())
        );

        $this->getJson("/api/v1/orders/{$order->id}/payments")
            ->assertOk()
            ->assertDontSee('pi_secret_private_example');
    }

    public function test_existing_active_payment_is_reused_instead_of_creating_duplicate(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder($user);

        Sanctum::actingAs($user);

        $firstResponse = $this->postJson(
            "/api/v1/orders/{$order->id}/payments",
            [
                'method' => 'card',
            ]
        );

        $firstResponse->assertCreated();

        $firstPaymentId = $firstResponse->json(
            'data.payment.id'
        );

        $secondResponse = $this->postJson(
            "/api/v1/orders/{$order->id}/payments",
            [
                'method' => 'card',
            ]
        );

        $secondResponse
            ->assertOk()
            ->assertJsonPath(
                'data.payment.id',
                $firstPaymentId
            );

        $this->assertDatabaseCount('payments', 1);
    }

    public function test_paid_order_cannot_create_another_payment_attempt(): void
    {
        $user = User::factory()->create();

        $order = $this->createOrder(
            $user,
            Payment::STATUS_PAID
        );

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PAID,
            'amount' => 115.00,
            'currency' => 'SAR',
            'transaction_id' => 'TX-PAID-001',
            'provider_reference' => 'FAKE-PAID-001',
            'paid_at' => now(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson(
            "/api/v1/orders/{$order->id}/payments",
            [
                'method' => 'card',
            ]
        );

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment');

        $this->assertDatabaseCount('payments', 1);
    }

    public function test_paid_webhook_marks_payment_and_order_paid_and_creates_one_invoice(): void
    {
        $user = User::factory()->create();
        $order = $this->createOrder($user);

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'FAKE-WEBHOOK-001',
        ]);

        $response = $this->postJson(
            '/api/v1/payments/webhooks/fake',
            [
                'reference' => 'FAKE-WEBHOOK-001',
                'status' => Payment::STATUS_PAID,
                'transaction_id' => 'TX-WEBHOOK-001',
            ],
            [
                'X-Webhook-Id' => 'EVENT-WEBHOOK-001',
                'X-Payment-Signature' => 'fake-signature',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('duplicate', false)
            ->assertJsonPath(
                'data.payment_id',
                $payment->id
            )
            ->assertJsonPath(
                'data.status',
                Payment::STATUS_PAID
            );

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => Payment::STATUS_PAID,
            'transaction_id' => 'TX-WEBHOOK-001',
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => Payment::STATUS_PAID,
        ]);

        $this->assertDatabaseHas('invoices', [
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'user_id' => $user->id,
            'status' => Invoice::STATUS_PAID,
        ]);

        $this->assertDatabaseCount('invoices', 1);
    }

    public function test_same_webhook_event_id_is_idempotent_even_with_different_payload(): void
    {
        $user = User::factory()->create();

        $activeAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $inactiveAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
        ]);
        $order = $this->createOrder($user);

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'FAKE-IDEMPOTENT-001',
        ]);

        $firstResponse = $this->postJson(
            '/api/v1/payments/webhooks/fake',
            [
                'reference' => 'FAKE-IDEMPOTENT-001',
                'status' => Payment::STATUS_PAID,
                'transaction_id' => 'TX-IDEMPOTENT-001',
            ],
            [
                'X-Webhook-Id' => 'EVENT-IDEMPOTENT-001',
            ]
        );

        $firstResponse
            ->assertOk()
            ->assertJsonPath('duplicate', false);

        $secondResponse = $this->postJson(
            '/api/v1/payments/webhooks/fake',
            [
                'reference' => 'DIFFERENT-REFERENCE',
                'status' => Payment::STATUS_FAILED,
                'transaction_id' => 'DIFFERENT-TX',
            ],
            [
                'X-Webhook-Id' => 'EVENT-IDEMPOTENT-001',
            ]
        );

        $secondResponse
            ->assertOk()
            ->assertJsonPath('duplicate', true);

        $this->assertSame(
            1,
            PaymentWebhookEvent::query()
                ->where(
                    'event_id',
                    'EVENT-IDEMPOTENT-001'
                )
                ->count()
        );

        $this->assertDatabaseHas('payments', [
            'provider_reference' => 'FAKE-IDEMPOTENT-001',
            'status' => Payment::STATUS_PAID,
            'transaction_id' => 'TX-IDEMPOTENT-001',
        ]);

        $this->assertDatabaseMissing('payments', [
            'transaction_id' => 'DIFFERENT-TX',
        ]);

        $this->assertDatabaseCount('invoices', 1);

        $adminNotification = Notification::query()
            ->where('user_id', $activeAdmin->id)
            ->where('type', 'payment')
            ->sole();

        $this->assertSame(
            Payment::STATUS_PAID,
            $adminNotification->data['status']
        );

        $this->assertSame(
            ['in_app'],
            $adminNotification->channels
        );

        $this->assertSame(
            0,
            Notification::where('user_id', $inactiveAdmin->id)->count()
        );

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $activeAdmin->id)
                ->where('type', 'payment')
                ->count()
        );

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'payment')
                ->where('data->status', Payment::STATUS_PAID)
                ->count()
        );
    }

    public function test_failed_secondary_attempt_does_not_override_paid_order_status(): void
    {
        $user = User::factory()->create();

        $order = $this->createOrder(
            $user,
            Payment::STATUS_PAID
        );

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PAID,
            'amount' => 115.00,
            'currency' => 'SAR',
            'transaction_id' => 'TX-PRIMARY-PAID',
            'provider_reference' => 'FAKE-PRIMARY-PAID',
            'paid_at' => now(),
        ]);

        $secondaryPayment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'FAKE-SECONDARY-FAIL',
        ]);

        $response = $this->postJson(
            '/api/v1/payments/webhooks/fake',
            [
                'reference' => 'FAKE-SECONDARY-FAIL',
                'status' => Payment::STATUS_FAILED,
                'transaction_id' => 'TX-SECONDARY-FAIL',
            ],
            [
                'X-Webhook-Id' => 'EVENT-SECONDARY-FAIL',
            ]
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.payment_id',
                $secondaryPayment->id
            )
            ->assertJsonPath(
                'data.status',
                Payment::STATUS_FAILED
            );

        $this->assertDatabaseHas('payments', [
            'id' => $secondaryPayment->id,
            'status' => Payment::STATUS_FAILED,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => Payment::STATUS_PAID,
        ]);

        $this->assertFalse(
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'payment')
                ->where('data->payment_id', $secondaryPayment->id)
                ->where('data->status', Payment::STATUS_FAILED)
                ->exists()
        );
    }

    public function test_manual_failed_secondary_payment_does_not_notify_when_order_is_already_paid(): void
    {
        $user = User::factory()->create();

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $order = $this->createOrder(
            $user,
            Payment::STATUS_PAID
        );

        Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PAID,
            'amount' => 115.00,
            'currency' => 'SAR',
            'transaction_id' => 'TX-MANUAL-PRIMARY-PAID',
            'provider_reference' => 'FAKE-MANUAL-PRIMARY-PAID',
            'paid_at' => now(),
        ]);

        $secondaryPayment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'FAKE-MANUAL-SECONDARY',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->patchJson(
            "/api/v1/admin/orders/{$order->id}/payments/{$secondaryPayment->id}/transition",
            [
                'status' => Payment::STATUS_FAILED,
                'failure_reason' => 'Secondary attempt failed',
            ]
        );

        $response->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $secondaryPayment->id,
            'status' => Payment::STATUS_FAILED,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => Payment::STATUS_PAID,
        ]);

        $this->assertFalse(
            Notification::query()
                ->where('user_id', $user->id)
                ->where('type', 'payment')
                ->where('data->payment_id', $secondaryPayment->id)
                ->where('data->status', Payment::STATUS_FAILED)
                ->exists()
        );
    }

    public function test_manual_paid_payment_notifies_active_admin_once(): void
    {
        $customer = User::factory()->create();

        $activeAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $inactiveAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
        ]);

        $order = $this->createOrder(
            $customer,
            Payment::STATUS_PENDING
        );

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PENDING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'FAKE-MANUAL-ADMIN-PAID',
        ]);

        Sanctum::actingAs($activeAdmin);

        $url = "/api/v1/admin/orders/{$order->id}/payments/{$payment->id}/transition";

        $this->patchJson($url, [
            'status' => Payment::STATUS_PAID,
            'transaction_id' => 'TX-MANUAL-ADMIN-PAID',
        ])->assertOk();

        $this->assertSame(
            Payment::STATUS_PAID,
            $payment->fresh()->status
        );

        $notification = Notification::query()
            ->where('user_id', $activeAdmin->id)
            ->where('type', 'payment')
            ->where('data->payment_id', $payment->id)
            ->sole();

        $this->assertSame(
            'تم استلام دفعة جديدة',
            $notification->title
        );

        $this->assertSame(
            Payment::STATUS_PAID,
            $notification->data['status']
        );

        $this->assertSame(
            $order->id,
            $notification->data['order_id']
        );

        $this->assertSame(
            ['in_app'],
            $notification->channels
        );

        $this->assertSame(
            0,
            Notification::query()
                ->where('user_id', $inactiveAdmin->id)
                ->count()
        );

        $this->patchJson($url, [
            'status' => Payment::STATUS_PAID,
        ])->assertUnprocessable();

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $activeAdmin->id)
                ->where('type', 'payment')
                ->where('data->payment_id', $payment->id)
                ->where('data->status', Payment::STATUS_PAID)
                ->count()
        );
    }
    public function test_moyasar_return_confirms_owned_paid_payment_and_issues_invoice_once(): void
    {
        Config::set('services.moyasar.secret_key', 'sk_test_stub');
        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => '11111111-1111-4111-8111-111111111111',
                'status' => 'paid',
                'description' => 'NUMAYR Payment #1',
                'amount' => 11500,
                'currency' => 'SAR',
            ], 200),
        ]);

        $user = User::factory()->create();
        $order = $this->createOrder($user);
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'intent-test-123',
        ]);

        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => '11111111-1111-4111-8111-111111111111',
                'status' => 'paid',
                'description' => 'NUMAYR Payment #' . $payment->id,
                'amount' => 11500,
                'currency' => 'SAR',
            ], 200),
        ]);

        Sanctum::actingAs($user);
        $path = "/api/v1/orders/{$order->id}/payments/confirm";
        $data = ['provider_payment_id' => '11111111-1111-4111-8111-111111111111'];

        $this->postJson($path, $data)
            ->assertOk()
            ->assertJsonPath('data.status', Payment::STATUS_PAID);
        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'payment_status' => Payment::STATUS_PAID,
        ]);
        $this->assertDatabaseCount('invoices', 1);
        $this->postJson($path, $data)
            ->assertOk()
            ->assertJsonPath('data.status', Payment::STATUS_PAID);
        $this->assertDatabaseCount('invoices', 1);
    }

    public function test_moyasar_return_rejects_mismatched_amount(): void
    {
        Config::set('services.moyasar.secret_key', 'sk_test_stub');
        $user = User::factory()->create();
        $order = $this->createOrder($user);
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'intent-test-456',
        ]);
        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => '22222222-2222-4222-8222-222222222222',
                'status' => 'paid',
                'description' => 'NUMAYR Payment #' . $payment->id,
                'amount' => 100,
                'currency' => 'SAR',
            ], 200),
        ]);
        Sanctum::actingAs($user);
        $this->postJson("/api/v1/orders/{$order->id}/payments/confirm", [
            'provider_payment_id' => '22222222-2222-4222-8222-222222222222',
        ])->assertUnprocessable();
        $this->assertDatabaseCount('invoices', 0);
        $this->assertSame(Payment::STATUS_PROCESSING, $payment->fresh()->status);
    }

    public function test_moyasar_paid_webhook_verifies_final_payment_and_settles_intent_order(): void
    {
        Config::set('services.moyasar.secret_key', 'sk_test_stub');
        Config::set('services.moyasar.webhook_secret', 'test-webhook-token');
        $user = User::factory()->create();
        $order = $this->createOrder($user);
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => '115.00',
            'currency' => 'SAR',
            'provider_reference' => 'intent-xyz',
        ]);
        $finalId = '33333333-3333-4333-8333-333333333333';
        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => $finalId, 'status' => 'paid',
                'description' => 'NUMAYR Payment #' . $payment->id,
                'amount' => 11500, 'currency' => 'SAR',
            ]),
        ]);
        $url = '/api/v1/payments/webhooks/moyasar';
        $body = [
            'id' => '44444444-4444-4444-8444-444444444444',
            'type' => 'payment_paid',
            'secret_token' => 'test-webhook-token',
            'data' => [
                'id' => $finalId, 'status' => 'paid',
                'amount' => 11500, 'currency' => 'SAR',
            ],
        ];
        $this->postJson($url, $body)->assertOk()->assertJsonPath('data.status', Payment::STATUS_PAID);
        $this->assertSame($finalId, $payment->fresh()->transaction_id);
        $this->assertSame('intent-xyz', $payment->fresh()->provider_reference);
        $this->assertSame(Payment::STATUS_PAID, $order->fresh()->payment_status);
        $this->assertDatabaseCount('invoices', 1);

        // An unauthenticated replay must not get a successful duplicate acknowledgement.
        $body['secret_token'] = 'wrong';
        $this->postJson($url, $body)->assertUnauthorized();
        $this->assertDatabaseCount('invoices', 1);
    }

    public function test_moyasar_webhook_rejects_amount_mismatch_without_issuing_invoice(): void
    {
        Config::set('services.moyasar.secret_key', 'sk_test_stub');
        Config::set('services.moyasar.webhook_secret', 'test-webhook-token');
        $user = User::factory()->create();
        $order = $this->createOrder($user);
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar', 'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => '115.00', 'currency' => 'SAR',
            'provider_reference' => 'intent-other',
        ]);
        $finalId = '55555555-5555-4555-8555-555555555555';
        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => $finalId, 'status' => 'paid',
                'description' => 'NUMAYR Payment #' . $payment->id,
                'amount' => 100, 'currency' => 'SAR',
            ]),
        ]);
        $this->postJson('/api/v1/payments/webhooks/moyasar', [
            'id' => '66666666-6666-4666-8666-666666666666',
            'type' => 'payment_paid', 'secret_token' => 'test-webhook-token',
            'data' => ['id' => $finalId, 'status' => 'paid'],
        ])->assertOk();
        $this->assertSame(Payment::STATUS_PROCESSING, $payment->fresh()->status);
        $this->assertDatabaseCount('invoices', 0);
    }

    public function test_failed_moyasar_return_unblocks_retry_without_invoice(): void
    {
        Config::set('services.moyasar.secret_key', 'sk_test_stub');
        $user = User::factory()->create();
        $order = $this->createOrder($user);
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'moyasar',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => '115.00',
            'currency' => 'SAR',
            'provider_reference' => 'intent-failed',
        ]);
        $paymentId = '77777777-7777-4777-8777-777777777777';
        \Illuminate\Support\Facades\Http::fake([
            'api.moyasar.com/*' => \Illuminate\Support\Facades\Http::response([
                'id' => $paymentId,
                'status' => 'failed',
                'description' => 'NUMAYR Payment #' . $payment->id,
                'amount' => 11500,
                'currency' => 'SAR',
            ]),
        ]);
        Sanctum::actingAs($user);
        $this->postJson("/api/v1/orders/{$order->id}/payments/confirm", [
            'provider_payment_id' => $paymentId,
        ])->assertOk()->assertJsonPath('data.status', Payment::STATUS_FAILED);
        $this->assertSame(Payment::STATUS_FAILED, $order->fresh()->payment_status);
        $this->assertDatabaseCount('invoices', 0);
    }

    private function createOrder(
        User $user,
        string $paymentStatus = Payment::STATUS_PENDING
    ): Order {
        return Order::create([
            'order_number' => 'ORD-'.fake()->unique()->numerify('########'),
            'user_id' => $user->id,
            'service_code' => 'water_refill',
            'service_name' => 'تعبئة مياه',
            'pricing_model' => 'fixed',
            'subtotal' => 100.00,
            'tax_rate' => 15.00,
            'tax_amount' => 15.00,
            'total_amount' => 115.00,
            'currency' => 'SAR',
            'status' => Order::STATUS_PENDING,
            'payment_status' => $paymentStatus,
            'service_data' => [
                'liters' => 2000,
            ],
            'address_snapshot' => [
                'city' => 'Riyadh',
            ],
        ]);
    }
}
