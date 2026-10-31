<?php

return [
    'smart_reminders_enabled' => env('SMART_REMINDERS_ENABLED', false),
    'filter_reminder_days' => max(1, (int) env('SMART_FILTER_DAYS', 180)),
    'refill_reminder_days' => max(1, (int) env('SMART_REFILL_DAYS', 30)),
    'health_threshold' => max(0, (int) env('SMART_HEALTH_THRESHOLD', 40)),
    'repeat_days' => max(1, (int) env('SMART_REPEAT_DAYS', 30)),
];
