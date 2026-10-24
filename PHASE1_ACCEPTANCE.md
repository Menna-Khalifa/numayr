# NUMAYR Phase 1 — acceptance and integration handoff

This is an evidence-based engineering checklist, not a certification that full UAT has passed. Do **not** merge to `main` solely because CI passes. Deployment and the production domain are intentionally deferred.

## Phase boundaries

Phase 1: customer sign-up/login (phone/email), four-digit OTP, password recovery, customer profile, addresses, cooler registration/photo/admin approval, refill/maintenance/filter services, quotation and price approval, orders/cancellation, subscriptions, notifications, invoices, admin customers/coolers/services/orders/payments/invoices/settings, responsive UI, and tests.

Exclude Phase 2: technician/provider/driver portals, dispatch, technician assignments, earnings, settlements, and live operational tracking. Existing Phase 2 code in `main` is outside this acceptance; do not delete it as part of Phase 1 cleanup.

## Reviewed evidence

- Frontend routes exist for registration, verify, login, forgot/reset password, dashboard, account, coolers, three service types, orders, subscriptions, invoices, notifications, settings, and admin sections.
- Laravel `routes/api.php` includes the corresponding customer/admin endpoints and authentication middleware.
- Automated CI `phase1-validation.yml` runs backend tests, frontend ESLint and production build. Passing those jobs proves only those checks, not comprehensive browser UAT.
- Authentic SMS delivery to a controlled Saudi number was confirmed manually. This does not certify resend, expiry, forgot-password and all negative paths end-to-end.
- Customer cooler creation accepts a textual `landmark`; latitude and longitude no longer need to be entered in the customer add-cooler form. Address selection via Hudhud is **not wired**.
- Existing Moyasar adapter includes create intent, status lookup and webhook secret validation. This does not mean the full browser checkout works.

## Release blockers / deferred dependencies

1. **Moyasar:** no production keys, live payment verification, production callback, or deployed webhook configured. The adapter's `createPayment` returns an intent `client_secret`, but `PaymentController` currently persists only `checkout_url`, while `PaymentResource` exposes only `checkout_url`. Therefore there is no evidenced full client-side intent fulfillment flow. Do not mark this as integration-ready merely by setting keys. Test with provider sandbox credentials and ensure amount/currency/status are verified before release.
2. **Hudhud:** public documentation confirms geocoding/places/autocomplete offerings but does not establish credentials or a working NUMAYR integration. Customer-facing text address entry is the current fallback. Provider adapter, selected-place identity, coordinate persistence (internally, not manual customer inputs), error handling and tests remain open.
3. **Acceptance/UAT:** test on real responsive viewports, no dead buttons/404s, role isolation, all quote-to-pay transitions, cooler approval impact on services, notifications, payment/invoice creation and duplicate webhook handling, canceled order logic, customer/admin security boundaries.
4. **Deployment:** hosting/domain, environment secrets, webhooks, email/SMS sender production details, database backup/migration verification, HTTPS and smoke tests remain deferred.

## Configuration for later connection

- Set `PAYMENT_PROVIDER=fake` during local development. Do not enable fake payments in production.
- When testing Moyasar in its official sandbox, set `PAYMENT_PROVIDER=moyasar`, `MOYASAR_SECRET_KEY`, `MOYASAR_PUBLISHABLE_KEY`, `MOYASAR_CALLBACK_URL`, and `MOYASAR_WEBHOOK_SECRET` outside the repository.
- Hudhud credentials are reserved as empty `HUDHUD_API_KEY` and `HUDHUD_BASE_URL` environment entries until the provider interface is implemented. Never treat these placeholders as a working map.
- Never commit actual credentials or local `.env` files.

## Acceptance rule

Only recommend merging after the known code gaps are addressed, CI completes successfully on the final commit, and phase-1 feature-by-feature UAT has verifiable results. Never merge to `main` without explicit user approval.
