<?php

return [
    'default' => env('PAYMENT_PROVIDER'),
    // Fail closed until subscription invoice and hosted checkout sign-off.
    'subscriptions_live_enabled' => false,
];
