<?php

return [
    'default' => env('PAYMENT_PROVIDER'),
    // Fail closed until subscription invoice and hosted checkout sign-off.
    'subscriptions_live_enabled' => false,
    // Provisional only: merchant must confirm VAT treatment before live.
    'subscription_invoice_tax_rate' => 0,
    'subscription_invoice_prices_include_tax' => true,
];
