<?php

namespace Tests\Feature;

use App\Models\Service;
use App\Models\User;
use Database\Seeders\ServiceSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ServiceCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_primary_services_are_available_after_catalog_seeding(): void
    {
        $this->seed(ServiceSeeder::class);

        $this->getJson('/api/v1/services')
            ->assertOk()
            ->assertJsonCount(3, 'data.services');

        foreach (['water_refill', 'maintenance', 'filter_change'] as $code) {
            $this->getJson("/api/v1/services/{$code}")
                ->assertOk()
                ->assertJsonPath('data.service.code', $code);
        }
    }

    public function test_admin_filter_option_price_update_reaches_customer_catalog(): void
    {
        $this->seed(ServiceSeeder::class);
        $service = Service::query()->where('code', 'filter_change')->firstOrFail();
        $settings = $service->settings;
        $settings['options'][1]['price'] = 165;
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->actingAs($admin)->patchJson("/api/v1/admin/services/{$service->id}", [
            'settings' => $settings,
        ])->assertOk()->assertJsonPath('data.service.settings.options.1.price', 165);
        $this->getJson('/api/v1/services/filter_change')
            ->assertOk()->assertJsonPath('data.service.settings.options.1.price', 165);
    }

    public function test_core_service_pricing_mode_cannot_be_changed(): void
    {
        $this->seed(ServiceSeeder::class);
        $service = Service::query()->where('code', 'water_refill')->firstOrFail();
        $admin = User::factory()->create(['role' => 'admin', 'is_active' => true]);
        $this->actingAs($admin)->patchJson('/api/v1/admin/services/'.$service->id, [
            'pricing_model' => 'fixed',
        ])->assertUnprocessable()->assertJsonValidationErrors('pricing_model');
        $this->assertSame('per_unit', $service->fresh()->pricing_model);
    }

    public function test_subscription_plans_are_available_after_catalog_seeding(): void
    {
        $this->seed(SubscriptionPlanSeeder::class);

        $response = $this->getJson('/api/v1/subscription-plans')
            ->assertOk();

        $this->assertNotEmpty($response->json('data.plans'));
    }
}
