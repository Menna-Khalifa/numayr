<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'code' => 'peace_of_mind',
                'name_ar' => 'اطمئن على صدقتك الجارية',
                'name_en' => 'Peace of Mind',
                'description_ar' => 'فحصان سنويًا + تنبيهات ذكية + أولوية + خصم 15%',
                'description_en' => '2 inspections per year + smart alerts + priority + 15% discount',
                'billing_cycle' => 'monthly',
                'price' => 19,
                'currency' => 'SAR',
                'benefits' => [
                    'annual_inspections' => 2,
                    'smart_alerts' => true,
                    'priority_service' => true,
                    'discount_percent' => 15,
                    'included_filter_changes' => 0,
                ],
                'savings_percent' => null,
                'is_featured' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'full_care',
                'name_ar' => 'العناية الكاملة',
                'name_en' => 'Full Care',
                'description_ar' => '4 فحوص + 3 تغييرات فلاتر مشمولة + أولوية + خصم 15%',
                'description_en' => '4 inspections + 3 included filter changes + priority + 15% discount',
                'billing_cycle' => 'monthly',
                'price' => 39,
                'currency' => 'SAR',
                'benefits' => [
                    'annual_inspections' => 4,
                    'smart_alerts' => true,
                    'priority_service' => true,
                    'discount_percent' => 15,
                    'included_filter_changes' => 3,
                ],
                'savings_percent' => null,
                'is_featured' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'annual_care',
                'name_ar' => 'العناية السنوية',
                'name_en' => 'Annual Care',
                'description_ar' => 'العناية الكاملة مدفوعة سنويًا',
                'description_en' => 'Full Care billed annually',
                'billing_cycle' => 'yearly',
                'price' => 390,
                'currency' => 'SAR',
                'benefits' => [
                    'annual_inspections' => 4,
                    'smart_alerts' => true,
                    'priority_service' => true,
                    'discount_percent' => 15,
                    'included_filter_changes' => 3,
                ],
                'savings_percent' => 17,
                'is_featured' => false,
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['code' => $plan['code']],
                $plan
            );
        }
    }
}
