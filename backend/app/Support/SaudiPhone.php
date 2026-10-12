<?php

namespace App\Support;

class SaudiPhone
{
    public static function normalize(string $phone): ?string
    {
        $phone = preg_replace('/[\s\-\(\)]/', '', trim($phone));

        if (preg_match('/^05[0-9]{8}$/', $phone)) {
            return $phone;
        }

        if (preg_match('/^(?:\+966|00966|966)5([0-9]{8})$/', $phone, $matches)) {
            return '05'.$matches[1];
        }

        if (preg_match('/^5([0-9]{8})$/', $phone, $matches)) {
            return '05'.$matches[1];
        }

        return null;
    }
}