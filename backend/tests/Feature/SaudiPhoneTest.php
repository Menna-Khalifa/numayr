<?php

namespace Tests\Feature;

use App\Support\SaudiPhone;
use PHPUnit\Framework\TestCase;

class SaudiPhoneTest extends TestCase
{
    public function test_saudi_mobile_formats_are_normalized(): void
    {
        foreach ([
            '0551234567',
            '+966551234567',
            '966551234567',
            '00966551234567',
            '551234567',
            '+966 55 123 4567',
        ] as $phone) {
            $this->assertSame(
                '0551234567',
                SaudiPhone::normalize($phone)
            );
        }
    }

    public function test_invalid_numbers_are_rejected(): void
    {
        foreach ([
            '',
            '123456',
            '051234567',
            '+971551234567',
            'abcdefghij',
        ] as $phone) {
            $this->assertNull(SaudiPhone::normalize($phone));
        }
    }
}