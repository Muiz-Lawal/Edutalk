Release: backend email stabilization, smoke tests, payment & certificate fixes

Tag: release-20260813-1516

Summary
- Stabilized backend email handling by standardizing on backend/src/utils/email2.js and replacing the fragile email.js with a thin wrapper.
- Added canonical smoke test scripts to exercise critical flows:
  - smoke/smoke-tests-fixed.mjs (compact auth → host → create-class → payment-intent → email)
  - smoke/smoke-confirm-and-certificate-v2.mjs (confirm → subscription → certificate issuance)
- Added a GitHub Actions workflow to run smoke & Phase6B validation on PRs and pushes to agents/continue; workflow now also supports manual dispatch.
- PaymentController: added mock confirm support for local testing (accepts pi_mock_* client secrets) and returns subscription id in confirm response.
- Certificate model & controller fixes: generate certificateNumber and verificationCode before validation, and use Subscription.userId when creating certificates.
- Cleaned up duplicate/malformed smoke scripts and other minor hygiene changes.

Testing
- Local Phase 6B validation passed (16/16).
- Local compact and confirm+certificate smoke tests passed.

Notes
- Real end-to-end payment and email tests require STRIPE_SECRET_KEY and SENDGRID_API_KEY in backend .env (do not commit secrets).
- Legacy backend/src/utils/email.js is now a thin wrapper that re-exports the safe implementation in email2.js.

Next steps
- Consider enabling the workflow to run on main or adding staging environment runs.
- Add CI secrets and enable real provider tests in a controlled environment.
- Merge to main (already merged) and create/publish a GitHub Release from the tag in the GitHub UI, or provide a token to allow automated release creation.
