<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'unread_only' => [
                'sometimes',
                'boolean',
            ],
            'type' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $notifications = Notification::query()
            ->where('user_id', $request->user()->id)
            ->when(
                $validated['unread_only'] ?? false,
                fn ($query) => $query->whereNull('read_at')
            )
            ->when(
                $validated['type'] ?? null,
                fn ($query, $type) => $query->where('type', $type)
            )
            ->latest('id')
            ->paginate($validated['per_page'] ?? 20);

        $unreadCount = Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function markAsRead(
        Request $request,
        int $notification
    ): JsonResponse {
        $notificationModel = Notification::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($notification);

        if ($notificationModel->read_at === null) {
            $notificationModel->update([
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحديد الإشعار كمقروء',
            'data' => [
                'notification' => $notificationModel->fresh(),
            ],
        ]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $updated = Notification::query()
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديد جميع الإشعارات كمقروءة',
            'data' => [
                'updated_count' => $updated,
            ],
        ]);
    }
}
