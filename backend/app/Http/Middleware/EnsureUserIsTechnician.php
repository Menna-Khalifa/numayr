<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsTechnician
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            ! $user ||
            $user->role !== 'technician' ||
            ! $user->is_active
        ) {
            abort(403);
        }

        return $next($request);
    }
}