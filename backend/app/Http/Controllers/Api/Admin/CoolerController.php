<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cooler;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class CoolerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['sometimes', 'nullable', 'string', 'max:255'],
            'approval_status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    'pending_review',
                    'approved',
                    'rejected',
                    'disabled',
                ]),
            ],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));

        $coolers = Cooler::query()
            ->with([
                'user:id,name,email,phone,is_active',
                'address',
            ])
            ->withCount('orders')
            ->when(
                $validated['approval_status'] ?? null,
                fn ($query, $status) =>
                    $query->where('approval_status', $status)
            )
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->where(function ($inner) use ($search) {
                        $inner
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('landmark', 'like', "%{$search}%")
                            ->orWhereHas(
                                'user',
                                fn ($userQuery) =>
                                    $userQuery
                                        ->where('name', 'like', "%{$search}%")
                                        ->orWhere('phone', 'like', "%{$search}%")
                                        ->orWhere('email', 'like', "%{$search}%")
                            );
                    });
                }
            )
            ->latest('id')
            ->paginate($validated['per_page'] ?? 20);

        $coolers->getCollection()->transform(
            fn ($cooler) => $this->presentCooler($cooler)
        );

        $stats = [
            'total' => Cooler::query()->count(),
            'pending_review' => Cooler::query()
                ->where('approval_status', 'pending_review')
                ->count(),
            'approved' => Cooler::query()
                ->where('approval_status', 'approved')
                ->count(),
            'rejected' => Cooler::query()
                ->where('approval_status', 'rejected')
                ->count(),
            'disabled' => Cooler::query()
                ->where('approval_status', 'disabled')
                ->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'coolers' => $coolers,
                'stats' => $stats,
            ],
        ]);
    }

    public function show(int $cooler): JsonResponse
    {
        $coolerModel = Cooler::query()
            ->with([
                'user:id,name,email,phone,is_active,created_at',
                'address',
                'orders' => fn ($query) =>
                    $query
                        ->latest('id')
                        ->limit(10),
            ])
            ->findOrFail($cooler);

        return response()->json([
            'success' => true,
            'data' => [
                'cooler' => $this->presentCooler($coolerModel),
            ],
        ]);
    }

    public function review(
        Request $request,
        int $cooler
    ): JsonResponse {
        $validated = $request->validate([
            'approval_status' => [
                'required',
                Rule::in([
                    'approved',
                    'rejected',
                    'disabled',
                ]),
            ],
            'reason' => [
                Rule::requiredIf(
                    fn () =>
                        $request->input('approval_status') === 'rejected'
                ),
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $coolerModel = Cooler::query()
            ->with('user')
            ->findOrFail($cooler);

        $approvalStatus = $validated['approval_status'];

        if ($coolerModel->approval_status === $approvalStatus) {
            $coolerModel->load([
                'user:id,name,email,phone,is_active',
                'address',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'لم يتغير قرار مراجعة البرادة',
                'data' => [
                    'cooler' => $this->presentCooler($coolerModel),
                ],
            ]);
        }
        $reason = trim((string) ($validated['reason'] ?? ''));

        $coolerModel->approval_status = $approvalStatus;
        $coolerModel->rejection_reason =
            $approvalStatus === 'rejected'
                ? $reason
                : null;
        $coolerModel->reviewed_at = now();
        $coolerModel->reviewed_by_user_id = $request->user()->id;
        $coolerModel->is_active =
            $approvalStatus !== 'disabled';
        $coolerModel->save();

        $message = match ($approvalStatus) {
            'approved' => [
                'title' => 'تم اعتماد البرادة',
                'body' => 'تمت مراجعة البرادة واعتمادها ويمكنك الآن استخدام خدمات نمير عليها.',
            ],
            'rejected' => [
                'title' => 'تحتاج البرادة إلى تعديل',
                'body' => $reason !== ''
                    ? 'تمت مراجعة البرادة. السبب: '.$reason
                    : 'تمت مراجعة البرادة وتحتاج إلى تعديل البيانات.',
            ],
            'disabled' => [
                'title' => 'تم إيقاف البرادة',
                'body' => 'تم إيقاف البرادة مؤقتًا بواسطة إدارة نمير.',
            ],
        };

        Notification::query()->create([
            'user_id' => $coolerModel->user_id,
            'type' => 'cooler_review',
            'title' => $message['title'],
            'body' => $message['body'],
            'data' => [
                'cooler_id' => $coolerModel->id,
                'approval_status' => $approvalStatus,
                'reason' => $reason !== '' ? $reason : null,
            ],
            'channels' => ['in_app'],
            'sent_at' => now(),
        ]);

        $coolerModel->load([
            'user:id,name,email,phone,is_active',
            'address',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة مراجعة البرادة',
            'data' => [
                'cooler' => $this->presentCooler($coolerModel),
            ],
        ]);
    }

    private function presentCooler($cooler): mixed
    {
        $cooler->setAttribute(
            'photo_url',
            $cooler->photo
                ? url(Storage::disk('public')->url($cooler->photo))
                : null
        );

        return $cooler;
    }
}
