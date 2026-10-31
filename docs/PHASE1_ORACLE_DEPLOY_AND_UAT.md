# NUMAYR — Phase 1 Oracle release & UAT checklist

> This is a live-test runbook, not an assertion that the website has passed UAT. Scope: customer + admin, phase 1 only. Live payment and all phase-2 operations excluded pending independent approval. Never use real customer records for test data.

## 0. Release identity and protection
- [ ] Record **exact** main commit SHA and passing Phase 1 CI + NUMAYR validation run URLs.
- [ ] Confirm all other branch commits are ancestors of main before removing refs.
- [ ] No open PRs. No uncommitted production changes lost.
- [ ] Back up the **existing** Oracle MySQL database, uploaded images, server configuration, and app .env; confirm backup can be restored. NEVER use migrate:fresh, force seed, reset --hard, delete historic orders or overwrite .env.
- [ ] Confirm PHP >=8.2 with required extensions, Node supported by project's lock file, MySQL and correct PHP-FPM socket.
- [ ] Confirm host, Nginx services and SSL name before changing any config.
- [ ] Source branch exactly main; inspect `git status --short`; do not pull if dirty until changes are preserved.
- [ ] `git fetch origin main`, review `git log` and update by `git pull --ff-only origin main`.
- [ ] Verify deployed `git rev-parse HEAD` equals approved SHA.
- [ ] Only after backup: `composer install --no-dev --prefer-dist --optimize-autoloader`; inspect `php artisan migrate:status`, then apply reviewed migrations with `php artisan migrate --force`.
- [ ] Preserve current `APP_KEY`. Set production `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://<verified-host>`, `APP_LOCALE=ar`, `APP_TIMEZONE=Asia/Riyadh`. Never publish .env.
- [ ] Check DB and queue connection, `FILESYSTEM_DISK=public`, storage permissions, `php artisan storage:link`; check public photo and private order attachment both remain correctly scoped.
- [ ] Confirm SMS driver, approved sender ID and Authentica settings through protected environment without printing secrets; test sending to a test phone only.
- [ ] Confirm Laravel scheduler actually runs `schedule:run` each minute. For smart reminders, default rules are provisional and must be agreed with merchant.
- [ ] Run `php artisan config:cache`, `php artisan route:cache`, `php artisan view:cache`; restart the correct services only after inspecting their names.
- [ ] `npm ci` and `npm run build` in frontend, with frontend API origin fixed **before** build. Use a supervised `next start` process, not a lingering SSH foreground process.
- [ ] Verify Nginx routes frontend `/` to Next.js and `/api/v1` to Laravel; Laravel's `public/index.php` only, never project root. Verify `/storage/...` for public photos. Check `nginx -t`.
- [ ] Verify TLS certificate and auto-renewal. No fake payment gateway in production, no live Moyasar charge; payment controls are an explicitly deferred acceptance item.
- [ ] External `curl`/browser checks: HTTPS redirect, home 200, registration page, `/api/v1/services` 200 JSON, unauthenticated private API 401 JSON, public image 200, invalid path 404.
- [ ] Check backend and Next.js logs while testing, with phone, OTP and secrets redacted.

## Test accounts and evidence
Use a **new test customer** with a valid Saudi mobile under your control, a real test email address, and a pre-authorized admin account. Record date/time, browser + device, test user ID, order ID, screenshot, and result per case. Never share login credentials/OTP in the report. Never rely on fake customer phone numbers to prove SMS delivery.

### A — Identity, profile, access
- [ ] A01 Registration requires the correct fields; required-field errors are readable Arabic.
- [ ] A02 Incorrect email/phone/duplicate phone rejected with Arabic errors.
- [ ] A03 Send four-digit OTP to controlled phone (provider delivery evidence).
- [ ] A04 Wrong OTP rejected; expired OTP rejected; resend cooldown and last valid OTP work.
- [ ] A05 Verify OTP and complete registration; profile appears immediately.
- [ ] A06 Login with allowed email/phone + password succeeds; invalid password fails.
- [ ] A07 Forgot password via OTP, wrong/expired code rejected, correct code resets password; old password no longer works.
- [ ] A08 Logout revokes the usable session; protected pages/API require login.
- [ ] A09 Edit name, Saudi phone, city, nationality and birth date; refresh and confirm persistence.
- [ ] A10 Duplicate phone, malformed date and oversized input return Arabic validation errors.
- [ ] A11 Add first address; it becomes default. Add second address; update and change default.
- [ ] A12 Delete a permitted address; remaining default remains correct; addresses never leak between accounts.
- [ ] A13 Customer cannot view admin pages or another customer's records.

### B — Coolers, pictures and review
- [ ] B01 Add cooler with name, address, water source network; list/detail show persisted information.
- [ ] B02 Add cooler with water source tanker + capacity; verify correct units, required capacity and persistence.
- [ ] B03 Upload supported test image; preview, save and refresh both customer and admin screens; verify real /storage URL.
- [ ] B04 Upload unsupported/oversized file; safe Arabic error, no broken persisted record.
- [ ] B05 New cooler initially pending review; user cannot place service order until approved.
- [ ] B06 Admin sees pending cooler and customer/address/photo.
- [ ] B07 Admin approves; customer gets in-app notification; services become available.
- [ ] B08 Admin rejects with reason; reason visible to customer; user edits and resubmits for review.
- [ ] B09 Admin disables; service creation blocked. Re-approve per allowed workflow.
- [ ] B10 Edit address, water source, tanker capacity, filter data, landmark, notes and image; verify after reload.
- [ ] B11 Clear optional fields and switch tanker to network; old capacity cleared.
- [ ] B12 Reject linking another customer's address/cooler; no cross-user image exposure.

### C — Services (all three)
- [ ] C01 Catalog contains refill, maintenance, filter change with Arabic labels and correct activation state.
- [ ] C02 Refill: select approved cooler and address, correct quantity/step and time slot; total and tax calculated; submit ONCE.
- [ ] C03 Refill: quantity below minimum/above maximum/invalid step blocked; invalid date blocked.
- [ ] C04 Refill: standard vs urgent fee and date eligibility match backend.
- [ ] C05 Maintenance: select issue type, description, optional photos, time and address; submit once; no duplicate order.
- [ ] C06 Maintenance: valid uploads visible to authorized admin, inaccessible to another customer.
- [ ] C07 Maintenance: order starts awaiting inspection; admin sends quote; customer sees quote, approves/rejects; no surprise price.
- [ ] C08 Filter change: select filter option, verify exact option price, address, time; create order.
- [ ] C09 Admin edits filter option price; customer catalog/order uses the updated option price (not unrelated base price).
- [ ] C10 Invalid filter option, inactive service, other user's cooler or unapproved cooler rejected.
- [ ] C11 Verify photos, notes, service_data, localized priority and Saudi time in both customer/admin details.
- [ ] C12 Check loading errors and retry behaviour, invalid ID, double click and network timeout for every service.

### D — Orders and status
- [ ] D01 My orders shows all newly created orders and correct status immediately.
- [ ] D02 Customer order detail shows service, cooler, address snapshot, amounts, attachments and progress history.
- [ ] D03 Customer can cancel eligible order with reason; repeated cancellation rejected.
- [ ] D04 Admin order queue, filters and details show exact customer, service and notes.
- [ ] D05 Admin order status transitions obey legal state graph; cannot skip forbidden transitions or complete paid service before payment.
- [ ] D06 No-charge test orders can finish their legal workflow; corresponding cooler last-refill/service date updates.
- [ ] D07 Notifications after creation, cancellation, quote, approval and status change go to correct recipients without duplicates.
- [ ] D08 Customer A cannot access/delete/order for customer B; admin can only perform authorized operations.

### E — Subscriptions (without payment)
- [ ] E01 List all active plans, correct monthly/yearly label and price.
- [ ] E02 Admin edits plan; customer sees updated price and conditions.
- [ ] E03 Selecting address lists **only** active approved coolers linked to that address.
- [ ] E04 Foreign/rejected/pending/disabled coolers cannot be selected.
- [ ] E05 Plan, location and cooler selection survive intended UI interactions; validation Arabic.
- [ ] E06 Pending/active subscription management and cancellation restrictions agree with backend.
- [ ] E07 Purchase, activation, recurring settlement and invoices dependent on paid subscriptions: **DEFERRED**, never claimed tested without payment approval.
- [ ] E08 Subscription expiry scheduled job works on disposable test records when separately approved for testing.

### F — Notifications and administration
- [ ] F01 Customer/admin inboxes have correct unread count and privacy.
- [ ] F02 Open, mark-one-read and mark-all-read work; refresh persists state.
- [ ] F03 Load notifications beyond 100 via pagination; search/filter read and unread.
- [ ] F04 In-app vs SMS preferences persist after refresh; SMS-only deliveries don't inflate in-app unread.
- [ ] F05 Real transactional SMS delivery to controlled number requires approved Authentica sender; verify provider outcome, not only fake HTTP tests.
- [ ] F06 Smart-alert opt-in/out, no duplicate same-rule alert, current configured intervals; scheduler running.
- [ ] F07 Admin dashboard, customer listing/detail, cooler review, service catalog/prices, orders, subscriptions, notifications, settings reachable.
- [ ] F08 Admin settings tax/currency affect newly generated prices correctly; malformed values rejected in Arabic.
- [ ] F09 Invoice list/detail and PDF for legitimate existing orders display correct totals and no internal metadata.
- [ ] F10 User cannot access admin invoices, other customer's invoices, payment secrets or private attachments.

### G — UX, responsiveness and final acceptance
- [ ] G01 Desktop (1440+), tablet (768), small mobile (360/375); no clipped RTL text or horizontal scroll.
- [ ] G02 All links, buttons, forms, dropdowns, modals, loaders, empty states and back/forward navigation work.
- [ ] G03 Images correctly sized, missing-image placeholder, no browser console fatal errors.
- [ ] G04 Browser refresh, expired token and slow network handled without silent failure.
- [ ] G05 All visible user-facing validation/errors Arabic; accessible focus and keyboard operation.
- [ ] G06 API log and browser network panel show no unexplained 4xx/5xx for successful paths.
- [ ] G07 Run final backend CI against exact deployed SHA; production smoke test after restart.
- [ ] G08 Record unresolved third-party dependencies rather than claiming them passed; request client's sign-off only after UAT evidence.

## Recording each case
`ID | Tested at | Browser/device | Expected | Actual | PASS/FAIL/BLOCKED | Screenshot/log link | Related issue/commit`

**Acceptance gate:** All non-payment Phase 1 cases PASS with evidence; real provider-dependent functions are verified on test accounts. Do not claim "100% guaranteed bug-free" merely because automated tests pass.
