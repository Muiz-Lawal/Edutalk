# Project plan and progress

Updated: 2026-08-16 — local smoke verification completed; payment controller lazy-init committed (see commit f4d5752)

## High-level goal
Finish Phase 6→7 transition: stabilize host create-class, payments, certificates, email; add compact smoke automation; and harden for production (webhook handling, CI smoke, tests, logging).

## Completed (so far)
- Stabilized email util and restored backend stability
- Added mock-friendly payment create + confirm flows
- Fixed certificate generation timing and mapping
- Added compact smoke scripts for auth → host → create-class → payments → certificates
- Implemented server-side Stripe webhook handler and mounted POST /api/payments/webhook
- Added webhook smoke script, integration smoke script, and in-memory DB runner for local validation
- Fixed badgeEngine duplicate-export error
- Added separated CI smoke jobs: standard in-memory fast smoke and optional real-provider run
- Added cleanup endpoint and test cleanup utilities for development smoke runs
- Completed production hardening pass: request logging, health/readiness checks, retry wrappers for transient failures, and hot-path DB indexes for users, classes, payments, and subscriptions
- Re-ran the smoke validations successfully after the hardening patch set

## Next / remaining (short list)
- Validate optional real-provider runs with secure CI secrets for STRIPE and email delivery (REQUIRED before Phase 7)
- Fix CI install step for branch/workflow contexts (lockfile handling) — updated workflows to fallback to `npm install` when a lockfile is not present and generated package-lock.json for backend/frontend locally (committed)
- Expand smoke coverage to admin and production deployment checks (add admin smoke runners)
- Add a deployment-readiness script and verify the backend health/ready endpoints before release
- Prepare certificate PDF/output polish and any release-specific deployment hardening

### Remaining Phase-7 gating checklist (sequential)
1. Ensure CI in-memory smoke is green (done: compact smoke passed in CI)
2. Use Brevo SMTP as the supported real-provider email path; use SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM. A Brevo API key is not interchangeable with a SendGrid API key unless the code explicitly supports that provider's API.
3. Configure repository secrets for real-provider runs: STRIPE_WEBHOOK_SECRET, STRIPE_SECRET_KEY, and the SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM). These must be added to GitHub repo secrets by a repo admin.
4. Run real-provider smoke (workflow_dispatch) and confirm payments, webhooks, and emails end-to-end in staging. Address any provider-specific failures.
5. Finalize certificate PDF generation and visual polish in staging (confirm templates, fonts, and download endpoints).
6. Verify logging, metrics, and alerts are configured for staging/production (structured logs, sampling, error rates, alert thresholds).
7. Confirm DB indexes and backups for production scale (ensure indexes applied, create backup plan).
8. Create release candidate tag and run release-readiness smoke against the release build.
9. Deploy to staging and run post-deploy smoke and manual exploratory checks.
10. When staging is green and stakeholders approve, create production release and run post-deploy smoke.

Notes:
- Steps 2–4 require provider secrets; do NOT store secrets in repo. Add them via GitHub -> Settings -> Secrets.
- Brevo SMTP is the preferred alternative because the project already supports SMTP in [backend/src/services/emailService.js](C:/Users/abdul/Desktop/class.worktrees/continue/backend/src/services/emailService.js) and in [.env.example](C:/Users/abdul/Desktop/class.worktrees/continue/backend/.env.example).
- While secrets are absent, use in-memory/mock modes for local and CI-based validation to avoid blocking progress.
- I will proceed to configure the email provider path to Brevo and then rerun the real-provider smoke using SMTP credentials instead of SendGrid.

## How to run locally (summary)
1. Copy .env.example to backend/.env and fill values (or use provided backend/.env for dev)
2. Start MongoDB and backend: `cd backend && npm run dev`
3. Run smoke scripts from backend/: `node smoke/smoke-tests-fixed.mjs` or `node smoke/webhook-integration.mjs`

## Notes
- Do NOT commit production secrets to repo; use CI secrets for real-provider runs.
- Webhook handler verifies signature when STRIPE_WEBHOOK_SECRET is present; in dev it falls back to unverified parsing for convenience.
