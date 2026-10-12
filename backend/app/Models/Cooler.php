<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
        'approval_status',
        'rejection_reason',
        'reviewed_at',
        'reviewed_by_user_id',
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
            'reviewed_at' => 'datetime',
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

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'reviewed_by_user_id'
        );
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function subscriptions(): BelongsToMany
    {
        return $this->belongsToMany(
            Subscription::class,
            'subscription_cooler'
        )->withTimestamps();
    }
}
