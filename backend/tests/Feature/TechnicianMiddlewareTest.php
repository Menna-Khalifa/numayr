<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureUserIsTechnician;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class TechnicianMiddlewareTest extends TestCase
{
    public function test_active_technician_is_allowed(): void
    {
        $user = new User([
            'role' => 'technician',
            'is_active' => true,
        ]);

        $request = Request::create('/technician-test');
        $request->setUserResolver(fn () => $user);

        $response = (new EnsureUserIsTechnician())->handle(
            $request,
            fn () => new Response('allowed', 200)
        );

        $this->assertSame(200, $response->getStatusCode());
    }

    public function test_customer_admin_and_inactive_technician_are_denied(): void
    {
        foreach ([
            ['customer', true],
            ['admin', true],
            ['technician', false],
        ] as [$role, $active]) {
            $user = new User([
                'role' => $role,
                'is_active' => $active,
            ]);

            $request = Request::create('/technician-test');
            $request->setUserResolver(fn () => $user);

            try {
                (new EnsureUserIsTechnician())->handle(
                    $request,
                    fn () => new Response('allowed', 200)
                );

                $this->fail("Access allowed for {$role}");
            } catch (HttpException $exception) {
                $this->assertSame(403, $exception->getStatusCode());
            }
        }
    }

    public function test_guest_is_denied(): void
    {
        $request = Request::create('/technician-test');

        $this->expectException(HttpException::class);

        (new EnsureUserIsTechnician())->handle(
            $request,
            fn () => new Response('allowed', 200)
        );
    }
}