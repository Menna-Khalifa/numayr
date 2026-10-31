<?php
namespace Tests\Feature;

use App\Models\User;
use App\Models\Notification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_notifications_are_private_to_the_owner(): void
    {
        $owner = User::factory()->create(['role' => 'customer', 'is_active' => true]);
        $other = User::factory()->create(['role' => 'customer', 'is_active' => true]);

        $notification = Notification::create([
            'user_id' => $other->id,
            'type' => 'order_status',
            'title' => 'تنبيه آخر',
            'body' => 'لا يظهر',
            'channels' => ['in_app'],
            'data' => [],
            'sent_at' => now(),
        ]);

        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonPath('data.unread_count', 0);

        $this->patchJson('/api/v1/notifications/'.$notification->id.'/read')
            ->assertNotFound();

        $this->assertNull($notification->fresh()->read_at);
    }
}
