<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\SubscriptionResource;
use App\Models\Address;
use App\Models\Cooler;
use App\Models\Payment;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Services\Payments\PaymentGatewayManager;
use App\Services\Payments\Gateways\MoyasarGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class SubscriptionController extends Controller
{
    public function plans(): JsonResponse
    {
        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'plans' => $plans,
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $subscriptions = Subscription::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'plan',
                'address',
                'coolers',
                'payments' => fn ($query) => $query->latest(),
            ])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'subscriptions' => SubscriptionResource::collection($subscriptions),
            ],
        ]);
    }

    public function show(
        Request $request,
        int $subscription
    ): JsonResponse {
        $subscriptionModel = Subscription::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'plan',
                'address',
                'coolers',
                'payments' => fn ($query) => $query->latest(),
            ])
            ->findOrFail($subscription);

        return response()->json([
            'success' => true,
            'data' => [
                'subscription' => new SubscriptionResource($subscriptionModel),
            ],
        ]);
    }

    public function store(
        Request $request,
        PaymentGatewayManager $gatewayManager
    ): JsonResponse {
        // Do not charge real money for subscriptions until invoicing and
        // provider-hosted end-to-end settlement have been accepted.
        if (
            config('payments.default') === 'moyasar'
            && config('services.moyasar.mode') === 'live'
            && ! config('payments.subscriptions_live_enabled', false)
        ) {
            throw ValidationException::withMessages([
                'subscription' => [
                    'الدفع الحقيقي للاشتراكات غير متاح حتى اعتماد الفواتير واختبارات بوابة الدفع',
                ],
            ]);
        }
        $validated = $request->validate([
            'plan_code' => [
                'required',
                'string',
                'exists:subscription_plans,code',
            ],

            'address_id' => [
                'required',
                'integer',
                'exists:addresses,id',
            ],

            'cooler_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'cooler_ids.*' => [
                'required',
                'integer',
                'distinct',
                'exists:coolers,id',
            ],

            'method' => [
                'required',
                'string',
                Rule::in([
                    'card',
                    'mada',
                    'apple_pay',
                ]),
            ],
        ]);

        // Validate configuration before creating pending subscription/payment rows.
        $provider = config('payments.default');
        if (! is_string($provider) || $provider === '') {
            throw ValidationException::withMessages([
                'subscription' => ['خدمة الدفع غير مهيأة حاليًا، يرجى المحاولة لاحقًا'],
            ]);
        }

        $user = $request->user();

        $plan = SubscriptionPlan::query()
            ->where('code', $validated['plan_code'])
            ->where('is_active', true)
            ->firstOrFail();

        $coolerIds = array_values(
            array_unique($validated['cooler_ids'])
        );

        $result = DB::transaction(function () use (
            $user,
            $plan,
            $coolerIds,
            $validated
        ) {
            $address = Address::query()
                ->where('id', $validated['address_id'])
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (! $address) {
                throw ValidationException::withMessages([
                    'address_id' => [
                        'الموقع المحدد غير صالح أو لا يخص حسابك',
                    ],
                ]);
            }

            $coolers = Cooler::query()
                ->whereIn('id', $coolerIds)
                ->where('user_id', $user->id)
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            if ($coolers->count() !== count($coolerIds)) {
                throw ValidationException::withMessages([
                    'cooler_ids' => [
                        'واحد أو أكثر من البرادات المحددة لا يخص حسابك',
                    ],
                ]);
            }

            $inactiveCoolers = $coolers
                ->where('is_active', false);

            if ($inactiveCoolers->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'cooler_ids' => [
                        'لا يمكن إضافة براد غير نشط إلى الاشتراك',
                    ],
                ]);
            }
            $unapprovedCoolers = $coolers
    ->where('approval_status', '!=', 'approved');

if ($unapprovedCoolers->isNotEmpty()) {
    throw ValidationException::withMessages([
        'cooler_ids' => [
            'لا يمكن إضافة برادة إلى الاشتراك قبل اعتمادها من الإدارة',
        ],
    ]);
}

            $differentAddressCoolers = $coolers
                ->where('address_id', '!=', $address->id);

            if ($differentAddressCoolers->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'cooler_ids' => [
                        'يجب أن تكون جميع البرادات المختارة في نفس الموقع المحدد',
                    ],
                ]);
            }

            $existingSubscription = Subscription::query()
                ->where('user_id', $user->id)
                ->where('address_id', $address->id)
                ->whereIn('status', [
                    Subscription::STATUS_PENDING,
                    Subscription::STATUS_ACTIVE,
                ])
                ->latest()
                ->first();

            if ($existingSubscription) {
                throw ValidationException::withMessages([
                    'subscription' => [
                        'لديك اشتراك نشط أو اشتراك قيد الدفع لهذا الموقع بالفعل',
                    ],
                ]);
            }

            $occupiedCoolerIds = DB::table('subscription_cooler as sc')
                ->join(
                    'subscriptions as s',
                    's.id',
                    '=',
                    'sc.subscription_id'
                )
                ->whereIn('sc.cooler_id', $coolerIds)
                ->whereIn('s.status', [
                    Subscription::STATUS_PENDING,
                    Subscription::STATUS_ACTIVE,
                ])
                ->pluck('sc.cooler_id')
                ->unique()
                ->values()
                ->all();

            if ($occupiedCoolerIds !== []) {
                throw ValidationException::withMessages([
                    'cooler_ids' => [
                        'واحد أو أكثر من البرادات المحددة مرتبط باشتراك نشط أو قيد الدفع بالفعل',
                    ],
                ]);
            }

            $subscription = Subscription::create([
                'user_id' => $user->id,
                'address_id' => $address->id,
                'coolers_count' => count($coolerIds),
                'plan_code' => $plan->code,
                'plan_name_ar' => $plan->name_ar,
                'plan_name_en' => $plan->name_en,
                'billing_cycle' => $plan->billing_cycle,
                'price' => $plan->price,
                'currency' => $plan->currency,
                'status' => Subscription::STATUS_PENDING,
                'benefits' => $plan->benefits,
                'metadata' => [
                    'plan_snapshot' => [
                        'code' => $plan->code,
                        'name_ar' => $plan->name_ar,
                        'name_en' => $plan->name_en,
                        'billing_cycle' => $plan->billing_cycle,
                        'price' => $plan->price,
                        'currency' => $plan->currency,
                        'benefits' => $plan->benefits,
                        'savings_percent' => $plan->savings_percent,
                    ],
                    'location_snapshot' => [
                        'address_id' => $address->id,
                    ],
                    'cooler_ids' => $coolerIds,
                    'coolers_count' => count($coolerIds),
                ],
            ]);

            $subscription
                ->coolers()
                ->attach($coolerIds);

            $payment = $subscription->payments()->create([
                'order_id' => null,
                'provider' => null,
                'method' => $validated['method'],
                'status' => Payment::STATUS_PENDING,
                'amount' => $plan->price,
                'currency' => $plan->currency,
                'metadata' => [
                    'payment_type' => 'subscription',
                    'subscription_id' => $subscription->id,
                    'plan_code' => $plan->code,
                    'address_id' => $address->id,
                    'cooler_ids' => $coolerIds,
                    'coolers_count' => count($coolerIds),
                ],
            ]);

            return [
                'subscription' => $subscription,
                'payment' => $payment,
            ];
        });

        $subscription = $result['subscription'];
        $payment = $result['payment'];

        try {
            $gateway = $gatewayManager->driver($provider);

            $gatewayResult = $gateway->createPayment($payment);
        } catch (Throwable $exception) {
            DB::transaction(function () use (
                $subscription,
                $payment,
                $exception
            ) {
                $paymentModel = Payment::query()
                    ->lockForUpdate()
                    ->findOrFail($payment->id);

                $subscriptionModel = Subscription::query()
                    ->lockForUpdate()
                    ->findOrFail($subscription->id);

                $paymentModel->update([
                    'status' => Payment::STATUS_FAILED,
                    'failed_at' => now(),
                    'failure_reason' => $exception->getMessage(),
                ]);

                $subscriptionModel->update([
                    'status' => Subscription::STATUS_CANCELLED,
                    'cancelled_at' => now(),
                ]);
            });

            throw $exception;
        }

        $payment = DB::transaction(function () use (
            $payment,
            $provider,
            $gatewayResult
        ) {
            $paymentModel = Payment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            $gatewayStatus = $gatewayResult['status']
                ?? Payment::STATUS_PROCESSING;

            if (! in_array(
                $gatewayStatus,
                [
                    Payment::STATUS_PENDING,
                    Payment::STATUS_PROCESSING,
                ],
                true
            )) {
                $gatewayStatus = Payment::STATUS_PROCESSING;
            }

            $metadata = $paymentModel->metadata ?? [];

            if (array_key_exists(
                'checkout_url',
                $gatewayResult
            )) {
                $metadata['checkout_url'] =
                    $gatewayResult['checkout_url'];
            }

            $paymentModel->update([
                'provider' => $provider,
                'provider_reference' => $gatewayResult['reference'] ?? null,
                'status' => $gatewayStatus,
                'metadata' => $metadata,
            ]);

            return $paymentModel;
        });

        $subscription->load([
            'plan',
            'address',
            'coolers',
            'payments',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الاشتراك ومحاولة الدفع بنجاح',
            'data' => [
                'subscription' => new SubscriptionResource($subscription),
                'payment' => new PaymentResource($payment),
                'checkout' => $provider === 'moyasar' ? [
                    'intent_id' => $gatewayResult['reference'] ?? null,
                    'client_secret' => $gatewayResult['client_secret'] ?? null,
                    'publishable_key' => config('services.moyasar.publishable_key'),
                    'callback_url' => config('services.moyasar.callback_url'),
                ] : null,
            ],
        ], 201);
    }

    public function cancel(
        Request $request,
        int $subscription
    ): JsonResponse {
        $owned = Subscription::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($subscription);

        if ($owned->status === Subscription::STATUS_PENDING) {
            $pendingMoyasarPayment = $owned->payments()
                ->where('provider', 'moyasar')
                ->whereIn('status', [
                    Payment::STATUS_PENDING,
                    Payment::STATUS_PROCESSING,
                ])->latest()->first();
            if ($pendingMoyasarPayment) {
                $reference = $pendingMoyasarPayment->provider_reference;
                if (!is_string($reference) || $reference === ''
                    || !app(MoyasarGateway::class)->cancelUnusedIntent($reference)) {
                    throw ValidationException::withMessages([
                        'subscription' => ['لا يمكن إلغاء الدفع قيد المعالجة قبل تأكيد نتيجته من ميسر'],
                    ]);
                }
            }
        }

        $subscriptionModel = DB::transaction(function () use (
            $request,
            $subscription
        ) {
            $subscriptionModel = Subscription::query()
                ->where('user_id', $request->user()->id)
                ->lockForUpdate()
                ->findOrFail($subscription);

            if (
                $subscriptionModel->status ===
                Subscription::STATUS_CANCELLED
            ) {
                throw ValidationException::withMessages([
                    'subscription' => [
                        'الاشتراك ملغي بالفعل',
                    ],
                ]);
            }

            if (
                $subscriptionModel->status ===
                Subscription::STATUS_EXPIRED
            ) {
                throw ValidationException::withMessages([
                    'subscription' => [
                        'الاشتراك منتهي بالفعل',
                    ],
                ]);
            }

            $subscriptionModel->update([
                'status' => Subscription::STATUS_CANCELLED,
                'cancelled_at' => now(),
            ]);

            return $subscriptionModel;
        });

        $subscriptionModel->load([
            'plan',
            'address',
            'coolers',
            'payments',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الاشتراك بنجاح',
            'data' => [
                'subscription' => new SubscriptionResource($subscriptionModel),
            ],
        ]);
    }
}
