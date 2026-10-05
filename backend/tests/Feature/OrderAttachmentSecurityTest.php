<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrderAttachmentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_view_own_attachment(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $order = $this->createOrder($user);

        Storage::disk('local')->put(
            'order-attachments/test-owner.txt',
            'owner-file'
        );

        $attachment = OrderAttachment::create([
            'order_id' => $order->id,
            'uploaded_by_user_id' => $user->id,
            'type' => 'photo',
            'disk' => 'local',
            'path' => 'order-attachments/test-owner.txt',
            'original_name' => 'test-owner.txt',
            'mime_type' => 'text/plain',
            'size' => 10,
        ]);

        Sanctum::actingAs($user);

        $this->get(
            "/api/v1/order-attachments/{$attachment->id}"
        )->assertOk();
    }

    public function test_other_customer_cannot_view_attachment(): void
    {
        Storage::fake('local');

        $owner = User::factory()->create();
        $otherUser = User::factory()->create();

        $order = $this->createOrder($owner);

        Storage::disk('local')->put(
            'order-attachments/test-private.txt',
            'private-file'
        );

        $attachment = OrderAttachment::create([
            'order_id' => $order->id,
            'uploaded_by_user_id' => $owner->id,
            'type' => 'photo',
            'disk' => 'local',
            'path' => 'order-attachments/test-private.txt',
            'original_name' => 'test-private.txt',
            'mime_type' => 'text/plain',
            'size' => 12,
        ]);

        Sanctum::actingAs($otherUser);

        $this->get(
            "/api/v1/order-attachments/{$attachment->id}"
        )->assertNotFound();
    }

    public function test_normal_customer_cannot_use_admin_attachment_endpoint(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $order = $this->createOrder($user);

        Storage::disk('local')->put(
            'order-attachments/test-admin-block.txt',
            'admin-block'
        );

        $attachment = OrderAttachment::create([
            'order_id' => $order->id,
            'uploaded_by_user_id' => $user->id,
            'type' => 'photo',
            'disk' => 'local',
            'path' => 'order-attachments/test-admin-block.txt',
            'original_name' => 'test-admin-block.txt',
            'mime_type' => 'text/plain',
            'size' => 11,
        ]);

        Sanctum::actingAs($user);

        $this->get(
            "/api/v1/admin/order-attachments/{$attachment->id}"
        )->assertForbidden();
    }

    public function test_admin_can_view_attachment_through_admin_endpoint(): void
    {
        Storage::fake('local');

        $owner = User::factory()->create();

        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $order = $this->createOrder($owner);

        Storage::disk('local')->put(
            'order-attachments/test-admin.txt',
            'admin-file'
        );

        $attachment = OrderAttachment::create([
            'order_id' => $order->id,
            'uploaded_by_user_id' => $owner->id,
            'type' => 'photo',
            'disk' => 'local',
            'path' => 'order-attachments/test-admin.txt',
            'original_name' => 'test-admin.txt',
            'mime_type' => 'text/plain',
            'size' => 10,
        ]);

        Sanctum::actingAs($admin);

        $this->get(
            "/api/v1/admin/order-attachments/{$attachment->id}"
        )->assertOk();
    }

    private function createOrder(User $user): Order
    {
        return Order::create([
            'order_number' => 'ORD-'.fake()->unique()->numerify('########'),
            'user_id' => $user->id,
            'service_code' => 'water_refill',
            'service_name' => 'تعبئة مياه',
            'pricing_model' => 'fixed',
            'subtotal' => 100.00,
            'tax_rate' => 15.00,
            'tax_amount' => 15.00,
            'total_amount' => 115.00,
            'currency' => 'SAR',
            'status' => Order::STATUS_PENDING,
            'payment_status' => 'pending',
            'service_data' => [
                'liters' => 2000,
            ],
            'address_snapshot' => [
                'city' => 'Riyadh',
            ],
        ]);
    }
}
