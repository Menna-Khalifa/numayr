<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CoolerController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Api\Admin\InvoiceController as AdminInvoiceController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\Admin\SystemSettingController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
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

    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{code}', [ServiceController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);

        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{address}', [AddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);

        Route::patch(
            '/addresses/{address}/default',
            [AddressController::class, 'setDefault']
        );

        Route::get('/coolers', [CoolerController::class, 'index']);
        Route::post('/coolers', [CoolerController::class, 'store']);
        Route::get('/coolers/{cooler}', [CoolerController::class, 'show']);
        Route::put('/coolers/{cooler}', [CoolerController::class, 'update']);
        Route::delete('/coolers/{cooler}', [CoolerController::class, 'destroy']);

        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);

        Route::patch(
            '/orders/{order}/cancel',
            [OrderController::class, 'cancel']
        );

        Route::get(
            '/orders/{order}/payments',
            [PaymentController::class, 'index']
        );

        Route::post(
            '/orders/{order}/payments',
            [PaymentController::class, 'store']
        );

        Route::get(
            '/orders/{order}/payments/{payment}',
            [PaymentController::class, 'show']
        );

        Route::get('/invoices', [InvoiceController::class, 'index']);
        Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);

        Route::prefix('admin')
            ->middleware('admin')
            ->group(function () {
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

                Route::patch(
                    '/orders/{order}/transition',
                    [OrderController::class, 'transition']
                );

                Route::patch(
                    '/orders/{order}/payments/{payment}/transition',
                    [PaymentController::class, 'transition']
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
            });
    });
});