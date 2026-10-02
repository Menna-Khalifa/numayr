<?php

namespace Database\Seeders;

use App\Models\SystemSetting;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        SystemSetting::updateOrCreate(
            [
                'key' => 'tax_rate',
            ],
            [
                'value' => '15',
                'type' => 'decimal',
                'group' => 'billing',
                'is_public' => true,
                'description' => 'Default tax rate percentage',
            ]
        );

        SystemSetting::updateOrCreate(
            [
                'key' => 'currency',
            ],
            [
                'value' => 'SAR',
                'type' => 'string',
                'group' => 'billing',
                'is_public' => true,
                'description' => 'Default billing currency',
            ]
        );
    }
}