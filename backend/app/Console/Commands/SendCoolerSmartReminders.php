<?php

namespace App\Console\Commands;

use App\Models\Cooler;
use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Services\Notifications\NotificationService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('coolers:smart-reminders')]
#[Description('Send deduplicated cooler maintenance and refill reminders')]
class SendCoolerSmartReminders extends Command
{
    public function handle(NotificationService $notifications): int
    {
        if (! config('numayr.smart_reminders_enabled', false)) {
            $this->info('Smart reminders remain disabled until business policy is approved.');
            return self::SUCCESS;
        }
        $today = now();
        $repeatDays = (int) config('numayr.repeat_days', 30);
        $filterDays = (int) config('numayr.filter_reminder_days', 180);
        $refillDays = (int) config('numayr.refill_reminder_days', 30);
        $healthLimit = (int) config('numayr.health_threshold', 40);
        $sent = 0;

        Cooler::query()->where('is_active', true)
            ->where('approval_status', 'approved')
            ->with('user')
            ->chunkById(100, function ($coolers) use (
                $notifications, $today, $repeatDays, $filterDays, $refillDays, $healthLimit, &$sent
            ) {
                foreach ($coolers as $cooler) {
                    $user = $cooler->user;
                    if (! $user || ! $user->is_active || $user->role !== 'customer') {
                        continue;
                    }
                    $preferences = NotificationPreference::query()
                        ->where('user_id', $user->id)->first();
                    if ($preferences && ! $preferences->smart_alerts_enabled) {
                        continue;
                    }
                    if ($preferences && ! $preferences->in_app_enabled && ! $preferences->sms_enabled) {
                        continue;
                    }

                    $rules = [];
                    if ($cooler->filter_installed_at
                        && $cooler->filter_installed_at->lte($today->copy()->subDays($filterDays))) {
                        $rules['filter'] = 'مر وقت طويل منذ تغيير فلتر '.$cooler->name.'، يُنصح بمراجعة حالته.';
                    }
                    if ($cooler->water_source === 'tanker' && $cooler->last_refill_at
                        && $cooler->last_refill_at->lte($today->copy()->subDays($refillDays))) {
                        $rules['refill'] = 'قد تحتاج برادة '.$cooler->name.' إلى تعبئة جديدة. تحقق من مستوى المياه.';
                    }
                    if ($cooler->health_score !== null && $cooler->health_score <= $healthLimit) {
                        $rules['health'] = 'درجة حالة برادة '.$cooler->name.' منخفضة؛ راجع احتياجها للصيانة.';
                    }

                    foreach ($rules as $rule => $message) {
                        $alreadySent = Notification::query()
                            ->where('user_id', $user->id)
                            ->where('type', 'smart_alert')
                            ->where('data->cooler_id', $cooler->id)
                            ->where('data->rule', $rule)
                            ->where('created_at', '>=', $today->copy()->subDays($repeatDays))
                            ->exists();
                        if ($alreadySent) {
                            continue;
                        }
                        $saved = $notifications->sendInApp(
                            userId: $user->id,
                            type: 'smart_alert',
                            title: 'تذكير بحالة البرادة',
                            body: $message,
                            data: ['cooler_id' => $cooler->id, 'rule' => $rule]
                        );
                        if ($saved !== null) {
                            $sent++;
                        }
                    }
                }
            });
        $this->info("Smart reminders recorded: {$sent}");
        return self::SUCCESS;
    }
}
