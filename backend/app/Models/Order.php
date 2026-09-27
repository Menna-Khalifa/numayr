<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'order_number',
        'user_id',
        'cooler_id',
        'service_id',
        'address_id',
        'service_code',
        'service_name',
        'pricing_model',
        'quantity',
        'unit',
        'base_price',
        'unit_price',
        'urgent_fee',
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
            'subtotal' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',

            'preferred_date' => 'date',
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',

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

    public function address(): BelongsTo
    {
        return $this->belongsTo(Address::class);
    }
}