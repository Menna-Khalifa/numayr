<?php

use App\Http\Controllers\Api\AddressController;

use App\Http\Controllers\Api\Admin\CustomerController as AdminCustomerController;

use App\Http\Controllers\Api\Admin\CoolerController as AdminCoolerController;

use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;

use App\Http\Controllers\Api\Admin\InvoiceController as AdminInvoiceController;

use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;

use App\Http\Controllers\Api\Admin\OrderQuoteController as AdminOrderQuoteController;
use App\Http\Controllers\Api\OrderQuoteController;

use App\Http\Controllers\Api\Admin\PaymentController as AdminPaymentController;

use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;

use App\Http\Controllers\Api\Admin\SubscriptionController as AdminSubscriptionController;

use App\Http\Controllers\Api\Admin\SystemSettingController;

use App\Http\Controllers\Api\AuthController;

use App\Http\Controllers\Api\CoolerController;

use App\Http\Controllers\Api\InvoiceController;

use App\Http\Controllers\Api\NotificationController;

use App\Http\Controllers\Api\NotificationPreferenceController;

use App\Http\Controllers\Api\OrderAttachmentController;

use App\Http\Controllers\Api\OrderController;

use App\Http\Controllers\Api\PasswordResetController;

use App\Http\Controllers\Api\PaymentController;

use App\Http\Controllers\Api\PaymentWebhookController;

use App\Http\Controllers\Api\ProfileController;

use App\Http\Controllers\Api\ServiceController;

use App\Http\Controllers\Api\SubscriptionController;

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Admin\SubscriptionPlanController as AdminSubscriptionPlanController;

Route::prefix('v1')->group(function () {

    Route::post('/auth/register/verify-otp', [\App\Http\Controllers\Api\RegistrationOtpController::class, 'verify'])
        ->middleware('throttle:password-verify');

    Route::post('/auth/register/resend-otp', [\App\Http\Controllers\Api\RegistrationOtpController::class, 'resend'])
        ->middleware('throttle:password-forgot');


    Route::post('/auth/register', [AuthController::class, 'register'])

        ->middleware('throttle:auth-register');

    Route::post('/auth/login', [AuthController::class, 'login'])

        ->middleware('throttle:auth-login');

    Route::post(

        '/auth/password/forgot',

        [PasswordResetController::class, 'requestOtp']

    )->middleware('throttle:password-forgot');

    Route::post(

        '/auth/password/verify-otp',

        [PasswordResetController::class, 'verifyOtp']

    )->middleware('throttle:password-verify');

    Route::post(

        '/auth/password/reset',

        [PasswordResetController::class, 'resetPassword']

    )->middleware('throttle:password-reset');

    Route::post(

        '/payments/webhooks/{provider}',

        [PaymentWebhookController::class, 'handle']

    )->middleware('throttle:payment-webhook');

    Route::get(

        '/invoice-shares/{invoice}',

        [InvoiceController::class, 'sharedPdf']

    )

        ->middleware('signed')

        ->name('invoices.shared.pdf');

    Route::get('/services', [ServiceController::class, 'index']);

    Route::get('/services/{code}', [ServiceController::class, 'show']);

    Route::get(

        '/subscription-plans',

        [SubscriptionController::class, 'plans']

    );

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('/auth/me', [AuthController::class, 'me']);

        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get(

            '/order-attachments/{attachment}',

            [OrderAttachmentController::class, 'show']

        );

        Route::get('/profile', [ProfileController::class, 'show']);

        Route::put('/profile', [ProfileController::class, 'update']);

        Route::get('/addresses', [AddressController::class, 'index']);

        Route::post('/addresses', [AddressController::class, 'store']);

        Route::put(

            '/addresses/{address}',

            [AddressController::class, 'update']

        );

        Route::delete(

            '/addresses/{address}',

            [AddressController::class, 'destroy']

        );

        Route::get(

            '/notifications',

            [NotificationController::class, 'index']

        );

        Route::patch(

            '/notifications/read-all',

            [NotificationController::class, 'markAllAsRead']

        );

        Route::patch(

            '/notifications/{notification}/read',

            [NotificationController::class, 'markAsRead']

        );

        Route::get(

            '/notification-preferences',

            [NotificationPreferenceController::class, 'show']

        );

        Route::patch(

            '/notification-preferences',

            [NotificationPreferenceController::class, 'update']

        );

        Route::patch(

            '/addresses/{address}/default',

            [AddressController::class, 'setDefault']

        );

        Route::get('/coolers', [CoolerController::class, 'index']);

        Route::post('/coolers', [CoolerController::class, 'store']);

        Route::get(

            '/coolers/{cooler}',

            [CoolerController::class, 'show']

        );

        Route::put(

            '/coolers/{cooler}',

            [CoolerController::class, 'update']

        );

        Route::delete(

            '/coolers/{cooler}',

            [CoolerController::class, 'destroy']

        );

        Route::get('/orders', [OrderController::class, 'index']);

        Route::post('/orders', [OrderController::class, 'store']);

        Route::get('/orders/{order}', [OrderController::class, 'show']);

        Route::post(
            '/orders/{order}/quote/approve',
            [OrderQuoteController::class, 'approve']
        );

        Route::post(
            '/orders/{order}/quote/reject',
            [OrderQuoteController::class, 'reject']
        );

        Route::patch(

            '/orders/{order}/cancel',

            [OrderController::class, 'cancel']

        );

        Route::post('/orders/{order}/payments/confirm', [PaymentWebhookController::class, 'confirmCustomerReturn'])->middleware('throttle:payment-webhook');

        Route::get(

            '/orders/{order}/payments',

            [PaymentController::class, 'index']

        );

        Route::post(

            '/orders/{order}/payments',

            [PaymentController::class, 'store']

        );

        Route::post(
            '/orders/{order}/payments/{payment}/abandon',
            [PaymentController::class, 'abandonUnused']
        )->middleware('throttle:payment-webhook');

        Route::get(

            '/orders/{order}/payments/{payment}',

            [PaymentController::class, 'show']

        );

        Route::get(

            '/invoices',

            [InvoiceController::class, 'index']

        );

        Route::get(

            '/invoices/{invoice}',

            [InvoiceController::class, 'show']

        );

        Route::get(

            '/invoices/{invoice}/pdf',

            [InvoiceController::class, 'pdf']

        );

        Route::get(

            '/invoices/{invoice}/download',

            [InvoiceController::class, 'download']

        );

        Route::post(

            '/invoices/{invoice}/share',

            [InvoiceController::class, 'share']

        );

        Route::get(

            '/subscriptions',

            [SubscriptionController::class, 'index']

        );

        Route::post(

            '/subscriptions',

            [SubscriptionController::class, 'store']

        );

        Route::get(

            '/subscriptions/{subscription}',

            [SubscriptionController::class, 'show']

        );

        Route::post('/subscriptions/{subscription}/payments/confirm', [PaymentWebhookController::class, 'confirmSubscriptionReturn'])->middleware('throttle:payment-webhook');

        Route::post(

            '/subscriptions/{subscription}/cancel',

            [SubscriptionController::class, 'cancel']

        );

        Route::prefix('admin')

            ->middleware('admin')

            ->group(function () {

                Route::get(

                    '/dashboard',

                    [AdminDashboardController::class, 'index']

                );

Route::get(

    '/subscription-plans',

    [AdminSubscriptionPlanController::class, 'index']

);

Route::patch(

    '/subscription-plans/{subscriptionPlan}',

    [AdminSubscriptionPlanController::class, 'update']

);

                Route::get(

                    '/settings',

                    [SystemSettingController::class, 'index']

                );

                Route::patch(

                    '/settings/{key}',

                    [SystemSettingController::class, 'update']

                );

                Route::get(

                    '/services',

                    [AdminServiceController::class, 'index']

                );

                Route::get(

                    '/services/{service}',

                    [AdminServiceController::class, 'show']

                );

                Route::get(

                    '/order-attachments/{attachment}',

                    [OrderAttachmentController::class, 'adminShow']

                );

                Route::patch(

                    '/services/{service}',

                    [AdminServiceController::class, 'update']

                );

                Route::get(

                    '/orders',

                    [AdminOrderController::class, 'index']

                );

                Route::get(

                    '/orders/{order}',

                    [AdminOrderController::class, 'show']

                );

                Route::post(

                    '/orders/{order}/quote',

                    [AdminOrderQuoteController::class, 'store']

                );

                Route::patch(

                    '/orders/{order}/transition',

                    [OrderController::class, 'transition']

                );
                Route::post(
                    '/orders/{order}/assign',
                    [\App\Http\Controllers\Api\Admin\OrderAssignmentController::class, 'store']
                );

                Route::patch(

                    '/orders/{order}/payments/{payment}/transition',

                    [PaymentController::class, 'transition']

                );

                Route::get(

                    '/coolers',

                    [AdminCoolerController::class, 'index']

                );

                Route::get(

                    '/coolers/{cooler}',

                    [AdminCoolerController::class, 'show']

                );

                Route::patch(

                    '/coolers/{cooler}/review',

                    [AdminCoolerController::class, 'review']

                );

                Route::get(

                    '/customers',

                    [AdminCustomerController::class, 'index']

                );

                Route::get(

                    '/customers/{customer}',

                    [AdminCustomerController::class, 'show']

                );

                Route::patch(

                    '/customers/{customer}/status',

                    [AdminCustomerController::class, 'updateStatus']

                );

                Route::get(

                    '/payments',

                    [AdminPaymentController::class, 'index']

                );

                Route::get(

                    '/payments/{payment}',

                    [AdminPaymentController::class, 'show']

                );

                Route::get(

                    '/invoices',

                    [AdminInvoiceController::class, 'index']

                );

                Route::get(

                    '/invoices/{invoice}',

                    [AdminInvoiceController::class, 'show']

                );

                Route::get(

                    '/subscriptions',

                    [AdminSubscriptionController::class, 'index']

                );

                Route::get(

                    '/subscriptions/{subscription}',

                    [AdminSubscriptionController::class, 'show']

                );

            });

    });

});
