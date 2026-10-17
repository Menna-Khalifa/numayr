<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_is_notified_once_only_after_successful_registration_verification(): void
    {
        $activeAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $inactiveAdmin = User::factory()->create([
            'role' => 'admin',
            'is_active' => false,
        ]);

        $customer = User::factory()->create([
            'name' => 'Test Customer',
            'phone' => '0551234567',
            'role' => 'customer',
            'is_active' => false,
        ]);

        PasswordResetOtp::create([
            'user_id' => $customer->id,
            'purpose' => 'registration',
            'channel' => 'sms',
            'otp_hash' => Hash::make('1234'),
            'expires_at' => now()->addMinutes(10),
            'attempts' => 0,
        ]);

        $this->assertSame(0, Notification::count());

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $customer->phone,
            'otp' => '9999',
        ])->assertUnprocessable();

        $this->assertSame(0, Notification::count());
        $this->assertFalse($customer->fresh()->is_active);

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $customer->phone,
            'otp' => '1234',
        ])->assertOk()->assertJsonPath('data.user.is_active', true);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $activeAdmin->id,
            'type' => 'customer_registration',
            'title' => 'عميل جديد انضم إلى نمير',
        ]);

        $notification = Notification::query()
            ->where('user_id', $activeAdmin->id)
            ->where('type', 'customer_registration')
            ->firstOrFail();

        $this->assertSame($customer->id, $notification->data['customer_id']);

        $this->assertSame(
            0,
            Notification::where('user_id', $inactiveAdmin->id)->count()
        );

        $this->assertSame(
            0,
            Notification::where('user_id', $customer->id)->count()
        );

        $this->assertSame(1, Notification::count());

        $this->postJson('/api/v1/auth/register/verify-otp', [
            'phone' => $customer->phone,
            'otp' => '1234',
        ])->assertUnprocessable();

        $this->assertSame(1, Notification::count());
    }
}