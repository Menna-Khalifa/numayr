<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Payment extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_PAID = 'paid';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'order_id',
        'subscription_id',
        'provider',
        'method',
        'status',
        'amount',
        'currency',
        'transaction_id',
        'provider_reference',
        'failure_reason',
        'metadata',
        'paid_at',
        'failed_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
            'paid_at' => 'datetime',
            'failed_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = [
            self::STATUS_PENDING => [
                self::STATUS_PROCESSING,
                self::STATUS_PAID,
                self::STATUS_FAILED,
            ],

            self::STATUS_PROCESSING => [
                self::STATUS_PAID,
                self::STATUS_FAILED,
            ],

            self::STATUS_PAID => [
                self::STATUS_REFUNDED,
            ],

            self::STATUS_FAILED => [],

            self::STATUS_REFUNDED => [],
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
                self::STATUS_FAILED,
                self::STATUS_REFUNDED,
            ],
            true
        );
    }
}
