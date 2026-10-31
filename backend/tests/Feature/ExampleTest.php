<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_unknown_api_route_returns_arabic_not_found_message(): void
    {
        $this->getJson('/api/v1/not-a-real-route')
            ->assertNotFound()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'المسار المطلوب غير موجود');
    }

    public function test_wrong_http_method_returns_arabic_error(): void
    {
        $this->putJson('/api/v1/auth/login')
            ->assertStatus(405)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'طريقة الطلب غير مسموح بها لهذا المسار');
    }

    public function test_protected_api_route_requires_login_in_arabic(): void
    {
        $this->getJson('/api/v1/profile')
            ->assertUnauthorized()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'يُرجى تسجيل الدخول للمتابعة');
    }

}
