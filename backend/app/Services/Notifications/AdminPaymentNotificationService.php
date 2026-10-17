<?php

namespace App\Services\Notifications;

use App\Models\Notification;
use App\Models\Payment;
use App\Models\User;

class AdminPaymentNotificationService
{
    public function notify(Payment $payment, string $status): void
    {
        $messages = [
            Payment::STATUS_PAID => 'تم استلام دفعة جديدة',
            Payment::STATUS_FAILED => 'فشلت عملية دفع',
            Payment::STATUS_REFUNDED => 'تم استرداد دفعة',
        ];

        if (! isset($messages[$status])) {
            return;
        }

        $payment->loadMissing(['order', 'subscription']);

        $order = $payment->order;
        $subscription = $payment->subscription;

        if (! $order && ! $subscription) {
            return;
        }

        if (
            $status === Payment::STATUS_FAILED
            && $order
            && $order->payment_status === Payment::STATUS_PAID
        ) {
            return;
        }

        $customerId = $order?->user_id ?? $subscription?->user_id;

        $data = [
            'payment_id' => $payment->id,
            'order_id' => $order?->id,
            'order_number' => $order?->order_number,
            'subscription_id' => $subscription?->id,
            'customer_id' => $customerId,
            'status' => $status,
            'payment_status' => $status,
            'amount' => $payment->amount,
            'currency' => $payment->currency,
        ];

        $subject = $order
            ? 'الطلب رقم '.$order->order_number
            : 'الاشتراك رقم '.$subscription->id;

        User::query()
            ->where('role', 'admin')
            ->where('is_active', true)
            ->pluck('id')
            ->each(function ($adminId) use ($payment, $status, $messages, $subject, $data) {
                $exists = Notification::query()
                    ->where('user_id', $adminId)
                    ->where('type', 'payment')
                    ->where('data->payment_id', $payment->id)
                    ->where('data->status', $status)
                    ->exists();

                if ($exists) {
                    return;
                }

                Notification::query()->create([
                    'user_id' => $adminId,
                    'type' => 'payment',
                    'title' => $messages[$status],
                    'body' => $messages[$status].' مرتبطة بـ '.$subject,
                    'data' => $data,
                    'channels' => ['in_app'],
                    'sent_at' => now(),
                ]);
            });
    }
}