<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
$validated = $request->validate([
            'search' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'is_active' => [
                'sometimes',
                'nullable',
                'boolean',
            ],

            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $customers = User::query()
            ->where('role', 'customer')
            ->withCount([
                'addresses',
                'coolers',
                'orders',
            ])
            ->when(
                $validated['search'] ?? null,
                function ($query, $search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                array_key_exists('is_active', $validated),
                function ($query) use ($validated) {
                    $query->where(
                        'is_active',
                        (bool) $validated['is_active']
                    );
                }
            )
            ->latest('id')
            ->paginate($validated['per_page'] ?? 15);

        return response()->json([
            'success' => true,
            'data' => [
                'customers' => $customers,
            ],
        ]);
    }

    public function show(Request $request, User $customer): JsonResponse
    {
if ($customer->role !== 'customer') {
            abort(404);
        }

        $customer->load([
            'addresses',
            'coolers',
            'orders' => function ($query) {
                $query
                    ->latest('id')
                    ->limit(20);
            },
        ]);

        $customer->loadCount([
            'addresses',
            'coolers',
            'orders',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $customer,
            ],
        ]);
    }

    public function updateStatus(
        Request $request,
        User $customer
    ): JsonResponse {
if ($customer->role !== 'customer') {
            abort(404);
        }

        $validated = $request->validate([
            'is_active' => [
                'required',
                'boolean',
            ],
        ]);

        $customer->update([
            'is_active' => $validated['is_active'],
        ]);

        if (! $customer->is_active) {
            $customer->tokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $customer->is_active
                ? 'Customer activated successfully'
                : 'Customer deactivated successfully',
            'data' => [
                'customer' => $customer->fresh(),
            ],
        ]);
    }
}
