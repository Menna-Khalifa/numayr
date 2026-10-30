<?php

namespace Tests\Feature;

use Database\Seeders\ServiceSeeder;
use Database\Seeders\SubscriptionPlanSeeder;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ServiceCatalogTest extends TestCase
{
    use DatabaseTransactions;

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

    public function test_subscription_plans_are_available_after_catalog_seeding(): void
    {
        $this->seed(SubscriptionPlanSeeder::class);

        $response = $this->getJson('/api/v1/subscription-plans')
            ->assertOk();

        $this->assertNotEmpty($response->json('data.plans'));
    }
}
