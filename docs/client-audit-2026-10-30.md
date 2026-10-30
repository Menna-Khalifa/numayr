# NUMAYR — Client acceptance audit (2026-10-30)

Source of truth for the seven client requirements and the production UI audit. The long conversational list contained overlapping observations; treat these as grouped acceptance criteria, not 49 independent bugs.

## Confirmed by production UI before this batch
- Three services created orders; water refill order 1, maintenance orders 2 and 3, filter order 4.
- Maintenance success modal could leave the form active; duplicate order observed. Preserve existing orders; no automatic cleanup.
- Admin received each order, but service_data (issue type, description, filter option) and private image attachments were not presented fully.
- Customer cooler 2 approved; image visible after fixing Nginx public /storage and Laravel APP_URL.
- Cooler registration had water supply inputs; details and edit form lacked them.
- Approved cooler 2 did not have a saved address association; subscription selector returned no eligible coolers for the selected account address.
- Admin order displayed priority and time slot as raw codes and preferred date as UTC.
- Legacy customer account missing phone; registration contained required mobile field, profile form contained a phone field.
- Customer cooler approval notification opened /coolers/2, and admin maintenance notification opened /admin/orders/3.
- Subscription plans listed publicly: SAR 19 monthly, SAR 39 monthly, SAR 390 yearly. Real Moyasar payment NOT certified/enabled.
- Service error component had already been unified; redirect to /coolers without a selected cooler was verified, but actual error screen was not.

## Code work on main after base 41b9aec
- Customer and admin cooler details expose water_source and tanker capacity; customer edit can change those values.
- New cooler and edited cooler can be assigned an existing account address (ownership validated by API). This avoids inventing the correct location for legacy coolers.
- Admin cooler details display filter installation date, landmark and stored address alongside review and health assessment.
- Admin orders expose service_data, localized filter options, formatted Saudi Gregorian schedule, price-per-unit when available and private attachments with authorized previews.
- Maintenance success flow routes to created order; submission has an in-flight guard. Filter success flow links to order details.
- Profile phone updates normalize/validate Saudi 05xxxxxxxx and reject duplicates across stored legacy formats; registration requires both email and phone.
- Feature coverage added for cooler address ownership and Saudi profile mobile behavior.

## Must verify before production deployment
- GitHub Actions on latest main: backend MySQL suite and frontend build BOTH green; do not infer from prior green run 41b9aec.
- Functional test: link cooler to an actual saved address, admin reapprove if required, confirm it appears in subscription selector; no payment.
- Maintenance upload of a genuine test image, admin authenticated preview, description/issue/notes, and no repeat submission.
- Filter option label and price consistent across customer/admin; refill total, schedule, timezone, notes.
- Existing account missing phone must be updated by owner with a REAL valid phone; never generate or guess it.
- Subscription purchase/payment, quote approval and payment settlement blocked on Moyasar live credentials/approval; do not fake success.
- Actual service load failures, remaining notification kinds, mobile responsive QA and NPM security advisories still require runtime evidence.
- Oracle Certbot automatic renewal remains a server-operations check, separate from repo code.

## Safe deployment policy
Production Oracle database and uploaded media must be backed up. No migrate:fresh, no forced seed, no deleting historical customer orders, no live payment mutations. Pull only main after CI, keep .env and secrets on the server, regenerate config cache as opc so php-fpm can use the MySQL config, and verify /api/v1/services and /storage/ images after restart.
