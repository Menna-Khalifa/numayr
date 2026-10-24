# NUMAYR — Moyasar live-payment release gate (Phase 1)

## Verified in the development branch
- Fixed-price customer order: test-mode payment intent, card form, successful 3DS redirect, server-side verification, paid order, invoice PDF.
- Inspection-based order: admin quote, customer approval before checkout, server-side payment gate.
- Automated tests: backend payment flow, webhook authentication, idempotency, amount/currency checks, browser build/lint.

## Must be done before using real money
1. **Do not commit keys**. Rotate previously exposed live and test secrets in Moyasar's dashboard. Configure current live **sk_live_** on the secure Laravel server, and **pk_live_** as the publishable key. Never send secret keys to the browser or GitHub.
2. Deploy backend and frontend behind public **HTTPS** and point `APP_URL`, the frontend API origin and `MOYASAR_CALLBACK_URL` at the correct verified domain. The callback must be `https://.../payment/callback`; localhost is test-only.
3. Configure the backend webhook URL `https://<backend-host>/api/v1/payments/webhooks/moyasar` in Moyasar and use a fresh, unique `MOYASAR_WEBHOOK_SECRET` matching the provider's `secret_token`. Verify connectivity and delivery using a test payment.
4. Set `PAYMENT_PROVIDER=moyasar`, `MOYASAR_MODE=live` and confirm the credentials belong to the same merchant account and live environment. The gateway rejects a live secret in test mode or a test secret in live mode.
5. **Subscription checkout is not yet ready for live use**: customer UI only saves selections. Do not enable a public paid-subscription checkout until its payment intent, provider callback, state transition and recovery path pass E2E testing.
6. Test a small authorized real transaction with the merchant's consent, check the provider dashboard and local database for matching transaction amount, currency, paid status, unique invoice and customer notification. Check failed/abandoned payments, duplicate webhooks and refunds policy.
7. Confirm reconciliation and customer-support playbook for payments where provider settles but site notification fails. Set up monitoring and alerts for webhook errors and stale processing payments.
8. Preserve checkout and invoice history when updating production. Do not merge into `main` or deploy without the project owner's approval.

## Production release status
BLOCKED pending public HTTPS deployment, regenerated credentials, subscription flow decision/completion, live webhook delivery test and merchant-authorized real transaction. Passing CI alone does not change this status.
