<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ArabicValidationTest extends TestCase
{
    public function test_required_email_and_phone_errors_are_in_arabic(): void
    {
        app()->setLocale('ar');
        $validator = Validator::make(
            ['email' => 'invalid', 'phone' => '123'],
            [
                'email' => ['required', 'email'],
                'phone' => ['required', 'regex:/^05[0-9]{8}$/'],
                'name' => ['required', 'string'],
            ]
        );
        $this->assertTrue($validator->fails());
        $this->assertStringContainsString('البريد الإلكتروني غير صحيح', $validator->errors()->first('email'));
        $this->assertStringContainsString('صيغة رقم الجوال غير صحيحة', $validator->errors()->first('phone'));
        $this->assertStringContainsString('حقل الاسم مطلوب', $validator->errors()->first('name'));
    }
}
