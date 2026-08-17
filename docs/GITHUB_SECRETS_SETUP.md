# Adding GitHub repository secrets for EduTalk (staging/production)

This document describes the exact secrets and steps required to enable real-provider CI and staging runs for EduTalk.

Important: Do NOT commit secret values into the repository. Use the GitHub UI or the `gh` CLI to add secrets.

Required secrets (names)
- STRIPE_SECRET_KEY: stripe secret key (sk_test_... or sk_live_... for production)
- STRIPE_WEBHOOK_SECRET: webhook signing secret (whsec_...)
- SMTP_HOST: SMTP host (e.g., smtp-relay.brevo.com)
- SMTP_PORT: SMTP port (e.g., 587)
- SMTP_USER: SMTP username (Brevo SMTP login)
- SMTP_PASS: SMTP password (Brevo SMTP password)
- SMTP_FROM: Sender address used for emails (e.g., no-reply@yourdomain.com)

Optional (for deployments/monitoring)
- FRONTEND_URL: public frontend URL for CORS & links
- REDIS_URL: redis connection string

UI steps (recommended for non-admins)
1. Go to your repository on GitHub: https://github.com/Muiz-Lawal/Edutalk
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter the secret name (exactly as listed above) and paste the secret value
5. Click Add secret
6. Repeat for each required secret

CLI steps (gh) — useful for automation (you will be prompted for the secret value):

# Example: set STRIPE_SECRET_KEY
gh secret set STRIPE_SECRET_KEY --repo Muiz-Lawal/Edutalk

# Or pipe a value (careful with shell history):
echo "sk_test_xxx" | gh secret set STRIPE_SECRET_KEY --repo Muiz-Lawal/Edutalk --body -

# Set SMTP_PASS using interactive prompt:
gh secret set SMTP_PASS --repo Muiz-Lawal/Edutalk

Notes and recommendations
- Use GitHub Environments for staging/production to restrict who can approve and which secrets are available to workflows.
- Rotate API keys if they were ever exposed or committed by mistake.
- For Brevo SMTP: SMTP_FROM should ideally be an address at a verified domain; for temporary testing use a team-controlled address and update when moving to production.
- The CI/workflows expect these exact secret names; changing names requires workflow edits.

Smoke test checklist (after secrets are added and deployment completed)
- Deploy v1.0.0-rc1 to staging
- Ensure the deployed backend responds at /api/health and /api/ready
- Run (locally or in CI):
  - BACKEND_URL=https://staging.example.com node ./scripts/deploy-smoke.mjs

If you want, run the CLI commands above with me present so I can help verify each step.
