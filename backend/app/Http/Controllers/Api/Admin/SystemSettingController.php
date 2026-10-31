<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SystemSettingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
$settings = SystemSetting::query()
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'settings' => $settings,
            ],
        ]);
    }

    public function update(Request $request, string $key): JsonResponse
    {
$setting = SystemSetting::query()
            ->where('key', $key)
            ->firstOrFail();

        $validated = match ($key) {
            'tax_rate' => $request->validate([
                'value' => [
                    'required',
                    'numeric',
                    'min:0',
                    'max:100',
                ],
            ]),

            'currency' => $request->validate([
                'value' => [
                    'required',
                    'string',
                    'size:3',
                    Rule::in([
                        'SAR',
                        'USD',
                        'AED',
                        'KWD',
                        'BHD',
                        'QAR',
                        'OMR',
                    ]),
                ],
            ]),

            default => $request->validate([
                'value' => [
                    'required',
                    'string',
                    'max:1000',
                ],
            ]),
        };

        $value = $validated['value'];

        if ($key === 'currency') {
            $value = strtoupper($value);
        }

        $setting->update([
            'value' => (string) $value,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث الإعداد بنجاح',
            'data' => [
                'setting' => $setting->fresh(),
            ],
        ]);
    }
}
