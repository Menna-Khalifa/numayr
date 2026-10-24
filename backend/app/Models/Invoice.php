<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    public const STATUS_ISSUED = 'issued';
    public const STATUS_PAID = 'paid';
    public const STATUS_VOID = 'void';
    public const STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'invoice_number',
        'order_id',
        'subscription_id',
        'payment_id',
        'user_id',
        'status',
        'customer_name',
        'customer_email',
        'customer_phone',
        'service_code',
        'service_name',
        'subtotal',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'currency',
        'address_snapshot',
        'service_data',
        'metadata',
        'issued_at',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'address_snapshot' => 'array',
            'service_data' => 'array',
            'metadata' => 'array',
            'issued_at' => 'datetime',
            'paid_at' => 'datetime',
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

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}