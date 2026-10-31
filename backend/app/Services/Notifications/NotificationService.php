<?php

namespace App\Services\Notifications;

use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Services\Sms\SmsService;
use Throwable;

class NotificationService
{
    public function __construct(
        private readonly SmsService $smsService
    ) {}

    public function sendInApp(
        int $userId,
        string $type,
        string $title,
        string $body,
        array $data = []
    ): ?Notification {
        $preference = NotificationPreference::query()
            ->where('user_id', $userId)
            ->first();

        $inAppEnabled = $preference?->in_app_enabled ?? true;
        $smsEnabled = $preference?->sms_enabled ?? true;

        $channels = [];

        if ($smsEnabled) {
            $user = User::query()->find($userId);

            if ($user && $user->phone) {
                try {
                    $this->smsService->send(
                        $user->phone,
                        "{$title}\n{$body}"
                    );

                    $channels[] = 'sms';
                } catch (Throwable $exception) {
                    report($exception);
                }
            }
        }

        if (! $inAppEnabled && $channels === []) {
            return null;
        }

        if ($inAppEnabled) {
            array_unshift($channels, 'in_app');
        }

        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $data,
            'channels' => $channels,
            'sent_at' => now(),
        ]);
    }
}
