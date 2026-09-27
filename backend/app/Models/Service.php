<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = [
        'code',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'pricing_model',
        'base_price',
        'unit_price',
        'unit',
        'minimum_quantity',
        'maximum_quantity',
        'quantity_step',
        'urgent_fee',
        'settings',
        'requires_cooler',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'base_price' => 'decimal:2',
            'unit_price' => 'decimal:4',
            'urgent_fee' => 'decimal:2',
            'minimum_quantity' => 'integer',
            'maximum_quantity' => 'integer',
            'quantity_step' => 'integer',
            'settings' => 'array',
            'requires_cooler' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}