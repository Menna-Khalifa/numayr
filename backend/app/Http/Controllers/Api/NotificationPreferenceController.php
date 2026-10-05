<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $preference = NotificationPreference::firstOrCreate(
            [
                'user_id' => $request->user()->id,
            ],
            [
                'in_app_enabled' => true,
                'sms_enabled' => true,
                'smart_alerts_enabled' => true,
                'settings' => [],
            ]
        );

        return response()->json([
            'success' => true,
            'data' => [
                'preferences' => $preference,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'in_app_enabled' => [
                'sometimes',
                'boolean',
            ],
            'sms_enabled' => [
                'sometimes',
                'boolean',
            ],
            'smart_alerts_enabled' => [
                'sometimes',
                'boolean',
            ],
            'settings' => [
                'sometimes',
                'nullable',
                'array',
            ],
        ]);

        $preference = NotificationPreference::firstOrCreate(
            [
                'user_id' => $request->user()->id,
            ],
            [
                'in_app_enabled' => true,
                'sms_enabled' => true,
                'smart_alerts_enabled' => true,
                'settings' => [],
            ]
        );

        $preference->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث تفضيلات الإشعارات بنجاح',
            'data' => [
                'preferences' => $preference->fresh(),
            ],
        ]);
    }
}
