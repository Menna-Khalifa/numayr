<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        Service::updateOrCreate(
            ['code' => 'water_refill'],
            [
                'name_ar' => 'تعبئة مياه التحلية',
                'name_en' => 'Desalinated Water Refill',

                'description_ar' => 'طلب تعبئة مياه للبرادة مع إمكانية اختيار الكمية باللتر.',
                'description_en' => 'Water refill service with quantity selection by liter.',

                'pricing_model' => 'per_unit',

                'base_price' => 0,
                'unit_price' => 0.05,
                'unit' => 'liter',

                'minimum_quantity' => 100,
                'maximum_quantity' => null,
                'quantity_step' => 1,

                'urgent_fee' => 15,

                'settings' => [
                    'preset_quantities' => [
                        500,
                        1000,
                        2000,
                        3000,
                    ],
                    'allow_custom_quantity' => true,
                ],

                'requires_cooler' => true,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        Service::updateOrCreate(
            ['code' => 'maintenance'],
            [
                'name_ar' => 'صيانة البرادة',
                'name_en' => 'Cooler Maintenance',

                'description_ar' => 'طلب فحص أو صيانة أعطال البرادة.',
                'description_en' => 'Cooler inspection and maintenance service.',

                'pricing_model' => 'quote',

                'base_price' => null,
                'unit_price' => null,
                'unit' => null,

                'minimum_quantity' => null,
                'maximum_quantity' => null,
                'quantity_step' => null,

                'urgent_fee' => 15,

                'settings' => [
                    'issue_types' => [
                        'تسرّب مياه',
                        'ضعف التبريد',
                        'صنبور تالف',
                        'عطل المضخة',
                        'ضوضاء',
                        'أخرى',
                    ],
                    'allow_photos' => true,
                ],

                'requires_cooler' => true,
                'is_active' => true,
                'sort_order' => 2,
            ]
        );

        Service::updateOrCreate(
            ['code' => 'filter_change'],
            [
                'name_ar' => 'تغيير الفلاتر',
                'name_en' => 'Filter Change',

                'description_ar' => 'خدمات تغيير وفحص وتنظيف فلاتر البرادة.',
                'description_en' => 'Cooler filter replacement, inspection, and cleaning services.',

                'pricing_model' => 'fixed',

                'base_price' => 100,
                'unit_price' => null,
                'unit' => null,

                'minimum_quantity' => null,
                'maximum_quantity' => null,
                'quantity_step' => null,

                'urgent_fee' => 0,

                'settings' => [
                    'options' => [
                        [
                            'code' => 'five_stage',
                            'name_ar' => 'تغيير الفلاتر الخمسة',
                            'name_en' => 'Replace Five Filters',
                            'description_ar' => 'القطع 50 + العمل 50',
                            'price' => 100,
                        ],
                        [
                            'code' => 'ro_membrane',
                            'name_ar' => 'تغيير غشاء RO',
                            'name_en' => 'Replace RO Membrane',
                            'description_ar' => 'القطع 90 + العمل 50',
                            'price' => 140,
                        ],
                        [
                            'code' => 'sterilization_cleaning',
                            'name_ar' => 'تعقيم وتنظيف',
                            'name_en' => 'Sterilization and Cleaning',
                            'description_ar' => 'تعقيم شامل للخزان',
                            'price' => 90,
                        ],
                        [
                            'code' => 'inspection_diagnosis',
                            'name_ar' => 'فحص وتشخيص',
                            'name_en' => 'Inspection and Diagnosis',
                            'description_ar' => 'يُخصم من الإصلاح إن تمّ',
                            'price' => 50,
                        ],
                    ],
                ],

                'requires_cooler' => true,
                'is_active' => true,
                'sort_order' => 3,
            ]
        );
    }
}
