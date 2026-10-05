<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Cooler extends Model
{
    protected $fillable = [
        'user_id',
        'address_id',
        'name',
        'photo',
        'latitude',
        'longitude',
        'landmark',
        'filter_type',
        'filter_installed_at',
        'status',
        'health_score',
        'last_refill_at',
        'last_maintenance_at',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'filter_installed_at' => 'datetime',
            'health_score' => 'integer',
            'last_refill_at' => 'datetime',
            'last_maintenance_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    public function subscriptions(): BelongsToMany
    {
        return $this->belongsToMany(
            Subscription::class,
            'subscription_cooler'
        )->withTimestamps();
    }
}
