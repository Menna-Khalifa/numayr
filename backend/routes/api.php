<?php

use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CoolerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\PaymentController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);

    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/services/{code}', [ServiceController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);

  Route::get('/orders', [OrderController::class, 'index']);
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders/{order}', [OrderController::class, 'show']);
Route::patch('/orders/{order}/cancel', [OrderController::class, 'cancel']);
Route::patch('/orders/{order}/transition', [OrderController::class, 'transition']);
Route::get('/orders/{order}/payments', [PaymentController::class, 'index']);
Route::post('/orders/{order}/payments', [PaymentController::class, 'store']);
Route::get('/orders/{order}/payments/{payment}', [PaymentController::class, 'show']);
Route::patch(
    '/orders/{order}/payments/{payment}/transition',
    [PaymentController::class, 'transition']
);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);

        Route::get('/addresses', [AddressController::class, 'index']);
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{address}', [AddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
        Route::patch('/addresses/{address}/default', [AddressController::class, 'setDefault']);

        Route::get('/coolers', [CoolerController::class, 'index']);
        Route::post('/coolers', [CoolerController::class, 'store']);
        Route::get('/coolers/{cooler}', [CoolerController::class, 'show']);
        Route::put('/coolers/{cooler}', [CoolerController::class, 'update']);
        Route::delete('/coolers/{cooler}', [CoolerController::class, 'destroy']);
    });
});