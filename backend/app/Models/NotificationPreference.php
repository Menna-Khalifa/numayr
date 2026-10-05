<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationPreference extends Model
{
    protected $fillable = [
        'user_id',
        'in_app_enabled',
        'sms_enabled',
        'smart_alerts_enabled',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'in_app_enabled' => 'boolean',
            'sms_enabled' => 'boolean',
            'smart_alerts_enabled' => 'boolean',
            'settings' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
