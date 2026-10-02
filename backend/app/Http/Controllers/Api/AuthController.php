<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
     $validated = $request->validate([
    'name' => ['required', 'string', 'max:255'],
    'email' => ['required', 'email', 'max:255', 'unique:users,email'],
    'phone' => ['required', 'string', 'max:30', 'unique:users,phone'],
    'password' => ['required', 'string', 'min:8', 'confirmed'],
]);
        $user = User::create([
    'name' => $validated['name'],
    'email' => $validated['email'],
    'phone' => $validated['phone'],
    'role' => 'customer',
    'is_active' => true,
    'password' => $validated['password'],
]);
        $token = $user->createToken('numayr-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء الحساب بنجاح',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ], 201);
    }

  public function login(Request $request): JsonResponse
{
    $validated = $request->validate([
        'email' => ['required', 'email'],
        'password' => ['required', 'string'],
    ]);

    $user = User::where('email', $validated['email'])->first();

    if (! $user || ! Hash::check($validated['password'], $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['بيانات الدخول غير صحيحة'],
        ]);
    }

    if (! $user->is_active) {
        throw ValidationException::withMessages([
            'email' => ['الحساب موقوف حاليًا'],
        ]);
    }

    $user->tokens()->delete();

    $token = $user->createToken('numayr-web')->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'تم تسجيل الدخول بنجاح',
        'data' => [
            'user' => $user,
            'token' => $token,
        ],
    ]);
}

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }
}