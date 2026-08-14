# Project plan and progress

Updated: 2026-08-14

## High-level goal
Finish Phase 6→7 transition: stabilize host create-class, payments, certificates, email; add compact smoke automation; and harden for production (webhook handling, CI smoke, tests, logging).

## Completed (so far)
- Stabilized email util (email2.js) and replaced fragile email.js
- Added mock-friendly payment create + confirm flows
- Fixed certificate generation timing and mapping
- Added compact smoke scripts for auth → host → create-class → payments → certificates
- Implemented server-side Stripe webhook handler and mounted POST /api/payments/webhook
- Added webhook smoke script, integration smoke script, and in-memory DB runner for local validation
- Fixed badgeEngine duplicate-export error
- Added separated CI smoke jobs: standard in-memory fast smoke and optional real-provider run
- Added cleanup endpoint and test cleanup utilities for development smoke runs

## Next / remaining (short list)
- Add DB-index review and apply indexes for frequently queried fields
- Add structured logging and attach Sentry (or similar) for errors
- Add retry/compensation strategies for transient Stripe/SendGrid errors
- Validate optional real-provider runs with secure CI secrets for STRIPE and SENDGRID
- Expand smoke coverage to certificate issuance and admin flows

## How to run locally (summary)
1. Copy .env.example to backend/.env and fill values (or use provided backend/.env for dev)
2. Start MongoDB and backend: `cd backend && npm run dev`
3. Run smoke scripts from backend/: `node smoke/smoke-tests-fixed.mjs` or `node smoke/webhook-integration.mjs`

## Notes
- Do NOT commit production secrets to repo; use CI secrets for real-provider runs.
- Webhook handler verifies signature when STRIPE_WEBHOOK_SECRET is present; in dev it falls back to unverified parsing for convenience.
