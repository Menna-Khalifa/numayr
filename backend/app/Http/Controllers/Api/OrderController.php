<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->orders()
            ->with([
                'cooler',
                'service',
                'address',
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_code' => [
                'required',
                'string',
                'exists:services,code',
            ],

            'cooler_id' => [
                'nullable',
                'integer',
            ],

            'address_id' => [
                'nullable',
                'integer',
            ],

            'quantity' => [
                'nullable',
                'numeric',
                'gt:0',
            ],

            'priority' => [
                'nullable',
                'in:standard,urgent',
            ],

            'preferred_date' => [
                'nullable',
                'date',
            ],

            'preferred_time_slot' => [
                'nullable',
                'in:morning,noon,evening',
            ],

            'service_data' => [
                'nullable',
                'array',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ]);

        $user = $request->user();

        $service = Service::query()
            ->where('code', $validated['service_code'])
            ->where('is_active', true)
            ->firstOrFail();

        $cooler = null;

        if ($service->requires_cooler) {
            if (empty($validated['cooler_id'])) {
                throw ValidationException::withMessages([
                    'cooler_id' => [
                        'يجب اختيار البرادة لهذه الخدمة',
                    ],
                ]);
            }

            $cooler = $user->coolers()
                ->where('is_active', true)
                ->findOrFail($validated['cooler_id']);
        }

        $address = null;

        if (! empty($validated['address_id'])) {
            $address = $user->addresses()
                ->findOrFail($validated['address_id']);
        } elseif ($cooler?->address_id) {
            $address = $user->addresses()
                ->find($cooler->address_id);
        }

        if (! $address) {
            throw ValidationException::withMessages([
                'address_id' => [
                    'يجب تحديد عنوان صالح لتنفيذ الطلب',
                ],
            ]);
        }

        $priority = $validated['priority'] ?? 'standard';

        $quantity = null;

        $basePrice = (float) ($service->base_price ?? 0);

        $unitPrice = $service->unit_price !== null
            ? (float) $service->unit_price
            : null;

        $urgentFee = $priority === 'urgent'
            ? (float) $service->urgent_fee
            : 0;

        $subtotal = 0;
        $serviceData = $validated['service_data'] ?? [];

        if ($service->pricing_model === 'per_unit') {
            if (! isset($validated['quantity'])) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'الكمية مطلوبة لهذه الخدمة',
                    ],
                ]);
            }

            $quantity = (float) $validated['quantity'];

            if (
                $service->minimum_quantity !== null &&
                $quantity < $service->minimum_quantity
            ) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'الكمية أقل من الحد الأدنى المسموح',
                    ],
                ]);
            }

            if (
                $service->maximum_quantity !== null &&
                $quantity > $service->maximum_quantity
            ) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'الكمية أكبر من الحد الأقصى المسموح',
                    ],
                ]);
            }

            if (
                $service->quantity_step !== null &&
                fmod(
                    $quantity - ($service->minimum_quantity ?? 0),
                    $service->quantity_step
                ) !== 0.0
            ) {
                throw ValidationException::withMessages([
                    'quantity' => [
                        'الكمية لا تتوافق مع الزيادة المسموح بها',
                    ],
                ]);
            }

            $subtotal = $basePrice + ($quantity * $unitPrice);
        } elseif ($service->pricing_model === 'fixed') {
            $subtotal = $basePrice;

            $settings = $service->settings ?? [];

            if ($service->code === 'filter_change') {
                if (empty($serviceData['option_code'])) {
                    throw ValidationException::withMessages([
                        'service_data.option_code' => [
                            'يجب اختيار نوع خدمة الفلاتر',
                        ],
                    ]);
                }

                $selectedOption = collect($settings['options'] ?? [])
                    ->firstWhere(
                        'code',
                        $serviceData['option_code']
                    );

                if (! $selectedOption) {
                    throw ValidationException::withMessages([
                        'service_data.option_code' => [
                            'خيار الفلتر المحدد غير صالح',
                        ],
                    ]);
                }

                $subtotal = (float) $selectedOption['price'];

                $serviceData['option_snapshot'] = $selectedOption;
            }
        } elseif ($service->pricing_model === 'quote') {
            $subtotal = 0;

            $settings = $service->settings ?? [];

            if ($service->code === 'maintenance') {
                if (empty($serviceData['issue_type'])) {
                    throw ValidationException::withMessages([
                        'service_data.issue_type' => [
                            'يجب تحديد نوع المشكلة',
                        ],
                    ]);
                }

                $allowedIssues = $settings['issue_types'] ?? [];

                if (! in_array(
                    $serviceData['issue_type'],
                    $allowedIssues,
                    true
                )) {
                    throw ValidationException::withMessages([
                        'service_data.issue_type' => [
                            'نوع المشكلة المحدد غير صالح',
                        ],
                    ]);
                }

                if (
                    isset($serviceData['description']) &&
                    ! is_string($serviceData['description'])
                ) {
                    throw ValidationException::withMessages([
                        'service_data.description' => [
                            'وصف المشكلة يجب أن يكون نصًا',
                        ],
                    ]);
                }
            }
        } else {
            throw ValidationException::withMessages([
                'service_code' => [
                    'نظام تسعير الخدمة غير مدعوم',
                ],
            ]);
        }

        $subtotal += $urgentFee;

        $taxRate = 0;
        $taxAmount = 0;
        $totalAmount = $subtotal;

        $order = DB::transaction(function () use (
            $user,
            $service,
            $cooler,
            $address,
            $validated,
            $priority,
            $quantity,
            $basePrice,
            $unitPrice,
            $urgentFee,
            $subtotal,
            $taxRate,
            $taxAmount,
            $totalAmount,
            $serviceData
        ) {
            return Order::create([
                'order_number' => $this->generateOrderNumber(),

                'user_id' => $user->id,
                'cooler_id' => $cooler?->id,
                'service_id' => $service->id,
                'address_id' => $address->id,

                'service_code' => $service->code,
                'service_name' => $service->name_ar,
                'pricing_model' => $service->pricing_model,

                'quantity' => $quantity,
                'unit' => $service->unit,

                'base_price' => $basePrice,
                'unit_price' => $unitPrice,
                'urgent_fee' => $urgentFee,

                'subtotal' => round($subtotal, 2),

                'tax_rate' => $taxRate,
                'tax_amount' => round($taxAmount, 2),

                'total_amount' => round($totalAmount, 2),

                'currency' => 'SAR',

                'priority' => $priority,
                'preferred_date' => $validated['preferred_date'] ?? null,
                'preferred_time_slot' => $validated['preferred_time_slot'] ?? null,

                'status' => 'pending',
                'payment_status' => 'pending',

                'service_data' => $serviceData,

                'address_snapshot' => [
                    'label' => $address->label,
                    'city' => $address->city,
                    'district' => $address->district,
                    'street' => $address->street,
                    'building' => $address->building,
                    'postal_code' => $address->postal_code,
                    'latitude' => $address->latitude,
                    'longitude' => $address->longitude,
                    'notes' => $address->notes,
                ],

                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $order->load([
            'cooler',
            'service',
            'address',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الطلب بنجاح',
            'data' => [
                'order' => $order,
            ],
        ], 201);
    }

    public function show(
        Request $request,
        int $order
    ): JsonResponse {
        $orderModel = $request->user()
            ->orders()
            ->with([
                'cooler',
                'service',
                'address',
            ])
            ->findOrFail($order);

        return response()->json([
            'success' => true,
            'data' => [
                'order' => $orderModel,
            ],
        ]);
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'NM-'
                . now()->format('ymd')
                . '-'
                . strtoupper(Str::random(6));
        } while (
            Order::query()
                ->where('order_number', $number)
                ->exists()
        );

        return $number;
    }
}