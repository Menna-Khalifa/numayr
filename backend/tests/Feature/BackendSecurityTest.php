<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackendSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_private_routes_require_authentication(): void
    {
        $routes = [
            ['GET', '/api/v1/profile'],
            ['GET', '/api/v1/addresses'],
            ['GET', '/api/v1/coolers'],
            ['GET', '/api/v1/orders'],
            ['GET', '/api/v1/invoices'],
            ['GET', '/api/v1/subscriptions'],
            ['GET', '/api/v1/notifications'],
            ['GET', '/api/v1/notification-preferences'],
        ];

        foreach ($routes as [$method, $uri]) {
            $response = $this->json($method, $uri);

            $response->assertStatus(
                401,
                "Expected {$method} {$uri} to require authentication."
            );
        }
    }

    public function test_customer_payment_routes_require_authentication(): void
    {
        $routes = [
            ['GET', '/api/v1/orders/1/payments'],
            ['POST', '/api/v1/orders/1/payments'],
            ['GET', '/api/v1/orders/1/payments/1'],
        ];

        foreach ($routes as [$method, $uri]) {
            $response = $this->json($method, $uri);

            $response->assertStatus(
                401,
                "Expected {$method} {$uri} to require authentication."
            );
        }
    }

    public function test_customer_invoice_routes_require_authentication(): void
    {
        $routes = [
            ['GET', '/api/v1/invoices/1'],
            ['GET', '/api/v1/invoices/1/pdf'],
            ['GET', '/api/v1/invoices/1/download'],
            ['POST', '/api/v1/invoices/1/share'],
        ];

        foreach ($routes as [$method, $uri]) {
            $response = $this->json($method, $uri);

            $response->assertStatus(
                401,
                "Expected {$method} {$uri} to require authentication."
            );
        }
    }

    public function test_customer_subscription_routes_require_authentication(): void
    {
        $routes = [
            ['GET', '/api/v1/subscriptions'],
            ['POST', '/api/v1/subscriptions'],
            ['GET', '/api/v1/subscriptions/1'],
            ['POST', '/api/v1/subscriptions/1/cancel'],
        ];

        foreach ($routes as [$method, $uri]) {
            $response = $this->json($method, $uri);

            $response->assertStatus(
                401,
                "Expected {$method} {$uri} to require authentication."
            );
        }
    }

    public function test_admin_routes_require_authentication(): void
    {
        $routes = [
            ['GET', '/api/v1/admin/customers'],
            ['GET', '/api/v1/admin/orders'],
            ['GET', '/api/v1/admin/payments'],
            ['GET', '/api/v1/admin/invoices'],
            ['GET', '/api/v1/admin/subscriptions'],
            ['GET', '/api/v1/admin/services'],
            ['GET', '/api/v1/admin/settings'],
        ];

        foreach ($routes as [$method, $uri]) {
            $response = $this->json($method, $uri);

            $response->assertStatus(
                401,
                "Expected {$method} {$uri} to require authentication."
            );
        }
    }

    public function test_public_routes_do_not_require_authentication(): void
    {
        $this->getJson('/api/v1/services')
            ->assertSuccessful();

        $this->getJson('/api/v1/subscription-plans')
            ->assertSuccessful();
    }
}
