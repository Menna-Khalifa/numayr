<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_CONFIRMED = 'confirmed';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number',
        'user_id',
        'cooler_id',
        'service_id',
        'subscription_id',
        'subscription_plan_code',
        'subscription_snapshot',
        'address_id',
        'service_code',
        'service_name',
        'pricing_model',
        'quantity',
        'unit',
        'base_price',
        'unit_price',
        'urgent_fee',
        'discount_percent',
        'discount_amount',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'currency',
        'priority',
        'preferred_date',
        'preferred_time_slot',
        'scheduled_at',
        'status',
        'payment_status',
        'service_data',
        'address_snapshot',
        'notes',
        'completed_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'base_price' => 'decimal:2',
            'unit_price' => 'decimal:4',
            'urgent_fee' => 'decimal:2',
            'discount_percent' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',

            'preferred_date' => 'date',
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',

            'subscription_snapshot' => 'array',
            'service_data' => 'array',
            'address_snapshot' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cooler(): BelongsTo
    {
        return $this->belongsTo(Cooler::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }

    public function statusHistory(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(OrderAttachment::class);
    }

    public function benefitUsages(): HasMany
    {
        return $this->hasMany(SubscriptionBenefitUsage::class);
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = [
            self::STATUS_PENDING => [
                self::STATUS_CONFIRMED,
                self::STATUS_CANCELLED,
            ],

            self::STATUS_CONFIRMED => [
                self::STATUS_IN_PROGRESS,
                self::STATUS_CANCELLED,
            ],

            self::STATUS_IN_PROGRESS => [
                self::STATUS_COMPLETED,
            ],

            self::STATUS_COMPLETED => [],

            self::STATUS_CANCELLED => [],
        ];

        return in_array(
            $newStatus,
            $allowedTransitions[$this->status] ?? [],
            true
        );
    }

    public function isFinalStatus(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_COMPLETED,
                self::STATUS_CANCELLED,
            ],
            true
        );
    }
}
