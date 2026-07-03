# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in EduTalk, please email us at **security@edutalk.com** instead of using the issue tracker.

**Please do not publicly disclose the vulnerability until we have had a chance to address it.**

### What to Include

When reporting a security vulnerability, please provide:

1. **Description** - What is the vulnerability?
2. **Location** - Which component/file is affected?
3. **Reproduction Steps** - How can we reproduce it?
4. **Impact** - What could an attacker do?
5. **Suggested Fix** (optional) - Do you have a fix?

## Response Timeline

- **Initial Response**: Within 24 hours
- **Assessment**: Within 48 hours
- **Fix Development**: 1-2 weeks (depending on severity)
- **Security Advisory**: Published after fix is released

## Security Best Practices

### For Users

- Never share your credentials with anyone
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- Enable two-factor authentication (when available)
- Keep your browser and dependencies updated
- Report suspicious activity immediately

### For Developers

- Validate all user inputs
- Use parameterized queries (MongoDB prevents injection)
- Hash passwords with bcrypt (minimum 10 rounds)
- Never log sensitive data
- Use HTTPS in production
- Keep dependencies updated
- Use environment variables for secrets
- Implement rate limiting
- Sanitize output

## Supported Versions

| Version | Status | Security Updates |
| ------- | ------ | ---------------- |
| 1.x     | Latest | ✅ Yes           |
| 0.x     | Legacy | ⏱️ Limited       |

## Known Vulnerabilities

None currently known. Please report any discovered vulnerabilities responsibly.

## Dependencies

We use Snyk and Dependabot to monitor dependencies for vulnerabilities. Updates are applied regularly.

To check dependencies yourself:

```bash
# Backend
cd backend
npm audit

# Frontend
cd frontend
npm audit
```

## Security Checklist

Before deploying to production:

- [ ] All `.env` files configured with production values
- [ ] JWT_SECRET is a long, random string
- [ ] HTTPS is enabled
- [ ] MongoDB is secured with strong credentials
- [ ] Stripe is in production mode, not test mode
- [ ] SendGrid credentials are production keys
- [ ] CORS is configured for your domain
- [ ] Rate limiting is enabled
- [ ] Logging is configured
- [ ] Backups are automated
- [ ] Monitoring is set up
- [ ] Database is backed up regularly
- [ ] Security headers are configured

## Updates & Patches

Subscribe to our releases page to be notified of security patches:
https://github.com/yourusername/edutalk/releases

## Questions?

For general security questions (not vulnerability reports), please reach out to [contact email].

---

Thank you for helping keep EduTalk secure! 🔒
