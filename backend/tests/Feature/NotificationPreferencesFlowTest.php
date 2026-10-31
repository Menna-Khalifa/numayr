<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\User;
use App\Services\Notifications\NotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NotificationPreferencesFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_sms_and_in_app_notifications_obey_the_users_saved_preferences(): void
    {
        $user = User::factory()->create([
            'phone' => '0501234567',
            'role' => 'customer',
            'is_active' => true,
        ]);
        $preference = NotificationPreference::create([
            'user_id' => $user->id,
            'in_app_enabled' => true,
            'sms_enabled' => true,
            'smart_alerts_enabled' => true,
            'settings' => [],
        ]);
        config()->set('services.sms.driver', 'authentica');
        config()->set('services.sms.from', 'NUMAYR');
        config()->set('services.authentica.api_key', 'test-value');
        config()->set('services.authentica.base_url', 'https://api.authentica.sa');
        Http::preventStrayRequests();
        Http::fake(['api.authentica.sa/*' => Http::response(['success' => true], 200)]);

        $notification = app(NotificationService::class)->sendInApp(
            $user->id, 'order_status', 'طلب جديد', 'تم إنشاء طلبك'
        );
        $this->assertNotNull($notification);
        $this->assertSame(['in_app', 'sms'], $notification->channels);
        Http::assertSentCount(1);

        $preference->update(['sms_enabled' => false, 'in_app_enabled' => false]);
        $this->assertNull(app(NotificationService::class)->sendInApp(
            $user->id, 'order_status', 'طلب آخر', 'حالة جديدة'
        ));
        $this->assertSame(1, Notification::where('user_id', $user->id)->count());
        Http::assertSentCount(1);
    }
}
