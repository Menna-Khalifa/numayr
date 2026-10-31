<?php

namespace Tests\Unit;

use App\Models\Order;
use Tests\TestCase;

class OrderStateTest extends TestCase
{
    public function test_order_status_transitions_follow_the_defined_lifecycle(): void
    {
        $allowed = [
            Order::STATUS_PENDING => [Order::STATUS_CONFIRMED, Order::STATUS_CANCELLED],
            Order::STATUS_CONFIRMED => [Order::STATUS_IN_PROGRESS, Order::STATUS_CANCELLED],
            Order::STATUS_IN_PROGRESS => [Order::STATUS_COMPLETED],
            Order::STATUS_COMPLETED => [],
            Order::STATUS_CANCELLED => [],
        ];

        foreach ($allowed as $status => $nextStatuses) {
            $order = new Order();
            $order->status = $status;
            foreach (array_keys($allowed) as $nextStatus) {
                self::assertSame(
                    in_array($nextStatus, $nextStatuses, true),
                    $order->canTransitionTo($nextStatus),
                    "{$status} -> {$nextStatus}"
                );
            }
        }
    }

    public function test_only_approved_quoted_orders_can_request_payment(): void
    {
        $order = new Order();
        $order->status = Order::STATUS_PENDING;
        $order->pricing_model = 'quote';
        $order->quote_status = Order::QUOTE_STATUS_AWAITING_APPROVAL;
        $order->total_amount = 150;

        self::assertFalse($order->isPaymentAllowed());

        $order->quote_status = Order::QUOTE_STATUS_APPROVED;
        $order->quote_approved_at = now();
        $order->quote_subtotal = 150;

        self::assertTrue($order->isPaymentAllowed());

        $order->status = Order::STATUS_CANCELLED;
        self::assertFalse($order->isPaymentAllowed());
    }
}
