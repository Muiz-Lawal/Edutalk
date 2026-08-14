This folder contains smoke and integration helpers for payment webhook testing.

Files:
- webhook-smoke.mjs: sends a signed payment_intent.succeeded event to /api/payments/webhook and asserts HTTP 200.
- webhook-integration.mjs: lightweight end-to-end integration smoke that:
  1. Registers a host and upgrades to host
  2. Creates a class as the host
  3. Registers a student
  4. Sends a signed payment_intent.succeeded webhook (metadata points to created class and student)
  5. Fetches the student's payment history and asserts a payment record exists

Usage examples:
  # Run simple webhook acceptance test (uses STRIPE_WEBHOOK_SECRET from env if set):
  STRIPE_WEBHOOK_SECRET=whsec_xxx node smoke/webhook-smoke.mjs

  # Run integration test (ensure server is running on BACKEND_URL):
  BACKEND_URL=http://localhost:5001 STRIPE_WEBHOOK_SECRET=whsec_xxx node smoke/webhook-integration.mjs

Notes:
- Tests are intended for development/staging. They may modify your local database (create users/classes/payments). Use a disposable DB or clean up after running.
- For CI, set STRIPE_WEBHOOK_SECRET as a secret or leave it empty to exercise the unverified parsing fallback.