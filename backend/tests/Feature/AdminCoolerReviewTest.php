<?php

namespace Tests\Feature;

use App\Models\Cooler;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminCoolerReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_repeating_approval_does_not_create_another_notification_or_change_review_time(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $customer = User::factory()->create([
            'role' => 'customer',
            'is_active' => true,
        ]);

        $cooler = Cooler::query()->create([
            'user_id' => $customer->id,
            'name' => 'Test Cooler',
            'approval_status' => 'pending_review',
            'is_active' => true,
        ]);

        Sanctum::actingAs($admin);

        $url = "/api/v1/admin/coolers/{$cooler->id}/review";

        $this->patchJson($url, [
            'approval_status' => 'approved',
        ])->assertOk()
          ->assertJsonPath('data.cooler.approval_status', 'approved');

        $cooler->refresh();

        $firstReviewedAt = $cooler->reviewed_at;
        $firstReviewedBy = $cooler->reviewed_by_user_id;

        $this->assertNotNull($firstReviewedAt);
        $this->assertSame($admin->id, $firstReviewedBy);

        $this->assertSame(
            1,
            Notification::query()
                ->where('user_id', $customer->id)
                ->where('type', 'cooler_review')
                ->count()
        );

        $this->travel(5)->minutes();

        try {
            $this->patchJson($url, [
                'approval_status' => 'approved',
            ])->assertOk()
              ->assertJsonPath('data.cooler.approval_status', 'approved');

            $cooler->refresh();

            $this->assertTrue(
                $firstReviewedAt->equalTo($cooler->reviewed_at)
            );

            $this->assertSame(
                $firstReviewedBy,
                $cooler->reviewed_by_user_id
            );

            $this->assertSame(
                1,
                Notification::query()
                    ->where('user_id', $customer->id)
                    ->where('type', 'cooler_review')
                    ->count()
            );
        } finally {
            $this->travelBack();
        }
    }
}