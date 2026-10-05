<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ResourceSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_view_another_customers_payment(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $order = $this->createOrder($otherUser);

        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'provider_reference' => 'provider-private-reference',
            'transaction_id' => 'transaction-private-id',
            'metadata' => [
                'checkout_url' => 'https://example.test/checkout',
                'internal_secret' => 'must-not-be-visible',
            ],
        ]);

        Sanctum::actingAs($owner);

        $this->getJson(
            "/api/v1/orders/{$order->id}/payments/{$payment->id}"
        )->assertNotFound();
    }

    public function test_customer_cannot_view_another_customers_invoice(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $order = $this->createOrder($otherUser);

        $payment = $this->createPayment($order);

        $invoice = $this->createInvoice(
            $otherUser,
            $order,
            $payment
        );

        Sanctum::actingAs($owner);

        $this->getJson(
            "/api/v1/invoices/{$invoice->id}"
        )->assertNotFound();
    }

    public function test_payment_show_does_not_expose_internal_payment_fields(): void
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
            'transaction_id' => 'transaction-secret-123',
            'provider_reference' => 'provider-secret-456',
            'failure_reason' => 'internal failure details',
            'metadata' => [
                'checkout_url' => 'https://example.test/checkout',
                'internal_secret' => 'secret-value',
            ],
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/v1/orders/{$order->id}/payments/{$payment->id}"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.payment.id',
                $payment->id
            )
            ->assertJsonPath(
                'data.payment.checkout_url',
                'https://example.test/checkout'
            )
            ->assertJsonMissingPath(
                'data.payment.provider'
            )
            ->assertJsonMissingPath(
                'data.payment.provider_reference'
            )
            ->assertJsonMissingPath(
                'data.payment.transaction_id'
            )
            ->assertJsonMissingPath(
                'data.payment.failure_reason'
            )
            ->assertJsonMissingPath(
                'data.payment.metadata'
            );
    }

    public function test_payment_index_does_not_expose_internal_payment_fields(): void
    {
        $user = User::factory()->create();

        $order = $this->createOrder($user);

        $this->createPayment($order);

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/v1/orders/{$order->id}/payments"
        );

        $response
            ->assertOk()
            ->assertJsonCount(
                1,
                'data.payments'
            )
            ->assertJsonMissingPath(
                'data.payments.0.provider'
            )
            ->assertJsonMissingPath(
                'data.payments.0.provider_reference'
            )
            ->assertJsonMissingPath(
                'data.payments.0.transaction_id'
            )
            ->assertJsonMissingPath(
                'data.payments.0.failure_reason'
            )
            ->assertJsonMissingPath(
                'data.payments.0.metadata'
            );
    }

    public function test_invoice_show_does_not_expose_internal_metadata(): void
    {
        $user = User::factory()->create();

        $order = $this->createOrder($user);
        $payment = $this->createPayment($order);

        $invoice = $this->createInvoice(
            $user,
            $order,
            $payment
        );

        Sanctum::actingAs($user);

        $response = $this->getJson(
            "/api/v1/invoices/{$invoice->id}"
        );

        $response
            ->assertOk()
            ->assertJsonPath(
                'data.invoice.id',
                $invoice->id
            )
            ->assertJsonPath(
                'data.invoice.invoice_number',
                $invoice->invoice_number
            )
            ->assertJsonMissingPath(
                'data.invoice.metadata'
            );
    }

    public function test_invoice_index_does_not_expose_internal_metadata(): void
    {
        $user = User::factory()->create();

        $order = $this->createOrder($user);
        $payment = $this->createPayment($order);

        $this->createInvoice(
            $user,
            $order,
            $payment
        );

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/invoices');

        $response
            ->assertOk()
            ->assertJsonMissingPath(
                'data.invoices.data.0.metadata'
            );
    }

    private function createOrder(User $user): Order
    {
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
            'payment_status' => Payment::STATUS_PENDING,
        ]);
    }

    private function createPayment(Order $order): Payment
    {
        return Payment::create([
            'order_id' => $order->id,
            'provider' => 'fake',
            'method' => 'card',
            'status' => Payment::STATUS_PROCESSING,
            'amount' => 115.00,
            'currency' => 'SAR',
            'transaction_id' => 'txn-'.fake()->unique()->uuid(),
            'provider_reference' => 'ref-'.fake()->unique()->uuid(),
            'failure_reason' => 'internal test failure reason',
            'metadata' => [
                'checkout_url' => 'https://example.test/checkout',
                'internal_secret' => 'must-not-leak',
            ],
        ]);
    }

    private function createInvoice(
        User $user,
        Order $order,
        Payment $payment
    ): Invoice {
        return Invoice::create([
            'invoice_number' => 'INV-'.fake()->unique()->numerify('########'),
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'user_id' => $user->id,
            'status' => Invoice::STATUS_PAID,
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'customer_phone' => null,
            'service_code' => $order->service_code,
            'service_name' => $order->service_name,
            'subtotal' => 100.00,
            'tax_rate' => 15.00,
            'tax_amount' => 15.00,
            'total_amount' => 115.00,
            'currency' => 'SAR',
            'address_snapshot' => [
                'city' => 'Riyadh',
            ],
            'service_data' => [
                'liters' => 2000,
            ],
            'metadata' => [
                'transaction_id' => $payment->transaction_id,
                'provider_reference' => $payment->provider_reference,
                'internal_secret' => 'must-not-leak',
            ],
            'issued_at' => now(),
            'paid_at' => now(),
        ]);
    }
}
