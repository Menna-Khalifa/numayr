<?php

return [
    'default' => env('PAYMENT_PROVIDER'),
    // Fail closed until subscription invoice and hosted checkout sign-off.
    'subscriptions_live_enabled' => env('SUBSCRIPTIONS_LIVE_ENABLED', false),
    // Provisional only: merchant must confirm VAT treatment before live.
    'subscription_invoice_tax_rate' => (float) env('SUBSCRIPTION_INVOICE_TAX_RATE', 0),
    'subscription_invoice_prices_include_tax' => env('SUBSCRIPTION_INVOICE_PRICES_INCLUDE_TAX', true),
];
