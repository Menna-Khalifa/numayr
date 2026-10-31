<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\NotificationPreference;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmartReminderTest extends TestCase
{
    use RefreshDatabase;

    public function test_scheduled_reminders_are_saved_once_and_respect_smart_alert_preference(): void
    {
        config()->set('numayr.smart_reminders_enabled', true);
        $customer = User::factory()->create([
            'role' => 'customer', 'is_active' => true, 'phone' => '0501234567',
        ]);
        $preferences = NotificationPreference::create([
            'user_id' => $customer->id,
            'in_app_enabled' => true,
            'sms_enabled' => false,
            'smart_alerts_enabled' => true,
            'settings' => [],
        ]);
        $customer->coolers()->create([
            'name' => 'برادة الفلتر',
            'water_source' => 'network',
            'filter_installed_at' => now()->subDays(190),
            'is_active' => true,
            'approval_status' => 'approved',
        ]);

        $this->artisan('coolers:smart-reminders')->assertExitCode(0);
        $this->artisan('coolers:smart-reminders')->assertExitCode(0);
        $this->assertSame(1, Notification::where('user_id', $customer->id)->count());
        $this->actingAs($customer)->getJson('/api/v1/notifications')
            ->assertOk()->assertJsonPath('data.unread_count', 1);

        $preferences->update(['smart_alerts_enabled' => false]);
        $customer->coolers()->create([
            'name' => 'برادة ثانية',
            'water_source' => 'network',
            'filter_installed_at' => now()->subDays(190),
            'is_active' => true,
            'approval_status' => 'approved',
        ]);
        $this->artisan('coolers:smart-reminders')->assertExitCode(0);
        $this->assertSame(1, Notification::where('user_id', $customer->id)->count());
    }

    public function test_sms_only_alerts_are_not_displayed_as_in_app_unread(): void
    {
        config()->set('numayr.smart_reminders_enabled', true);
        $customer = User::factory()->create([
            'role' => 'customer', 'is_active' => true, 'phone' => '0501234567',
        ]);
        NotificationPreference::create([
            'user_id' => $customer->id,
            'in_app_enabled' => false,
            'sms_enabled' => true,
            'smart_alerts_enabled' => true,
            'settings' => [],
        ]);
        $customer->coolers()->create([
            'name' => 'برادة صهريج',
            'water_source' => 'tanker',
            'tank_capacity_liters' => 1000,
            'last_refill_at' => now()->subDays(40),
            'is_active' => true,
            'approval_status' => 'approved',
        ]);
        $this->artisan('coolers:smart-reminders')->assertExitCode(0);
        $notification = Notification::query()->where('user_id', $customer->id)->firstOrFail();
        $this->assertSame(['sms'], $notification->channels);
        $this->actingAs($customer)->getJson('/api/v1/notifications')
            ->assertOk()->assertJsonPath('data.unread_count', 0);
    }
}
