<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'authentica' => [
        'api_key' => env('AUTHENTICA_API_KEY'),
        'base_url' => env(
            'AUTHENTICA_BASE_URL',
            'https://api.authentica.sa'
        ),
        'channel' => 'sms',
        'timeout' => 15,
        'otp_ttl_minutes' => 5,
    ],
    'sms' => [
        'driver' => env('SMS_DRIVER', 'log'),
        'from' => env('SMS_FROM', 'NUMAYR'),
    ],

    'moyasar' => [
        'mode' => env('MOYASAR_MODE', 'test'),
        'publishable_key' => env('MOYASAR_PUBLISHABLE_KEY'),
        'secret_key' => env('MOYASAR_SECRET_KEY'),
        'currency' => env('MOYASAR_CURRENCY', 'SAR'),
        'base_url' => env(
            'MOYASAR_BASE_URL',
            'https://api.moyasar.com/v1'
        ),
        'callback_url' => env('MOYASAR_CALLBACK_URL'),
        'webhook_secret' => env('MOYASAR_WEBHOOK_SECRET'),
    ],

];
