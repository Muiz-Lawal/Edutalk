# Project plan and progress

Updated: 2026-08-17 — Release-readiness completed locally; mock-safe payment flow validated; draft release published (v1.0.0-rc1). Staging secrets were added and local smoke passed. Moving to Phase 2 (product development) with an initial kickoff.

Phase 2 kickoff (short term goals)
- Real-time video (WebRTC): prototype one-to-one and small-group rooms, server-side signalling, TURN/STUN config.
- Session recording: record, store, and playback classroom sessions; design storage and retention.
- AI features: moderation, summarization, and auto-generated resource notes.
- Analytics & reporting: host dashboards, student engagement metrics, event collection.
- Payment polish & automation: finalize Stripe webhooks, automated payouts, and reconciliation in production.

Immediate next actions (first sprint)
1. Phase-2 kickoff meeting & architecture review (stakeholders). (owner: product/tech lead)
2. Proof-of-concept: WebRTC signalling server + simple React client integration. (owner: engineering)
3. Session recording POC (select storage, S3-compatible, or cloud provider). (owner: engineering)
4. AI moderation POC (content moderation and summarization pipeline). (owner: engineering/data)
5. Add integration tests and CI coverage for new realtime/recording flows. (owner: QA/engineering)

Acceptance criteria to move Phase-2 from discovery → build
- A working WebRTC POC with signalling and connectivity across NATs (TURN configured).
- Session recording proof that stores and plays back recordings with metadata searchable by class/session.
- Basic AI moderation/summarization that flags policy violations and generates short summaries for recorded sessions.
- CI runners for realtime flows and end-to-end smoke passing on a staging environment.

Notes
- Production rollout requires deployment automation, metrics, and monitoring for realtime components (TURN servers, media servers).
- Keep release branch v1.0.0-rc1 for any hotfixes; phase-2 work can begin on `feature/phase-2-kickoff` or similar branch.

Files changed and scripts added during release-readiness are retained on branch `agents/continue`. Continue Phase-2 work on a new feature branch and open PRs against main when ready.


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
- Fixed frontend/backend live-stream URL mismatches and added backward-compatible live routes; validated host/viewer join flow locally (stream creation + viewer join + stats) on localhost:5001

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
