# Project plan and progress

Updated: 2026-08-14

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
- Validate optional real-provider runs with secure CI secrets for STRIPE and SENDGRID
- Fix CI install step for branch/workflow contexts (lockfile handling) — updated workflows to fallback to `npm install` when a lockfile is not present and generated package-lock.json for backend/frontend locally (to be committed)
- Expand smoke coverage to admin and production deployment checks
- Add a deployment-readiness script and verify the backend health/ready endpoints before release
- Prepare certificate PDF/output polish and any release-specific deployment hardening

## How to run locally (summary)
1. Copy .env.example to backend/.env and fill values (or use provided backend/.env for dev)
2. Start MongoDB and backend: `cd backend && npm run dev`
3. Run smoke scripts from backend/: `node smoke/smoke-tests-fixed.mjs` or `node smoke/webhook-integration.mjs`

## Notes
- Do NOT commit production secrets to repo; use CI secrets for real-provider runs.
- Webhook handler verifies signature when STRIPE_WEBHOOK_SECRET is present; in dev it falls back to unverified parsing for convenience.
