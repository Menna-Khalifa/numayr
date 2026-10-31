<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_cannot_access_admin_dashboard_and_sees_arabic_error(): void
    {
        $customer = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);

        Sanctum::actingAs($customer);

        $this->getJson('/api/v1/admin/dashboard')
            ->assertForbidden()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
    }
    public function test_phase_two_technician_assignment_is_not_exposed(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/admin/orders/1/assign', [
            'technician_id' => 1,
        ])->assertNotFound();
    }

}
