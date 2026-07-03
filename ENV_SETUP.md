# .env Configuration Guide

This guide explains how to properly configure your `.env` files for EduTalk.

## Backend Configuration

### Location

```
backend/.env
```

### Required Variables

```env
# ===== ESSENTIAL SERVER SETUP =====
NODE_ENV=development                    # development, staging, or production
PORT=5000                               # Server port

# ===== MONGODB DATABASE =====
# Option 1: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/edutalk

# Option 2: MongoDB Atlas (Cloud)
# MONGODB_URI=mongodb+srv://username:password@cluster0.abc123.mongodb.net/edutalk?retryWrites=true&w=majority
```

### Authentication

```env
# ===== JWT (JSON Web Tokens) =====
JWT_SECRET=your_super_secret_key_here_make_it_long_and_random_32_chars_minimum
JWT_EXPIRE=7d                           # Token expiration time
```

⚠️ **Security Alert**: Generate a secure JWT_SECRET:

```powershell
# PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))
```

### Payment Processing (Stripe)

```env
# ===== STRIPE TEST KEYS (for development) =====
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Test Card for Development
# Card Number: 4242 4242 4242 4242
# Expiry: Any future date (e.g., 12/25)
# CVC: Any 3 digits (e.g., 123)
```

Get these from: https://dashboard.stripe.com/apikeys

### Email Service (SendGrid)

```env
# ===== SENDGRID EMAIL =====
SENDGRID_API_KEY=your_sendgrid_api_key_here
FROM_EMAIL=noreply@edutalk.com
```

Get API key from: https://app.sendgrid.com/settings/api_keys

### AI Moderation (OpenAI)

```env
# ===== OPENAI (Content Moderation) =====
OPENAI_API_KEY=sk-your_openai_key_here
```

Get API key from: https://platform.openai.com/api-keys

### URLs & CORS

```env
# ===== FRONTEND & BACKEND URLS =====
FRONTEND_URL=http://localhost:5173      # Frontend dev URL
BACKEND_URL=http://localhost:5000       # Backend URL

# For Production:
# FRONTEND_URL=https://edutalk.com
# BACKEND_URL=https://api.edutalk.com
```

### Email (Alternative to SendGrid)

```env
# ===== NODEMAILER SMTP CONFIGURATION =====
SMTP_HOST=smtp.gmail.com                # Gmail: smtp.gmail.com
SMTP_PORT=587                           # Gmail: 587 (TLS)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password    # NOT your regular Gmail password!

# Gmail App Password Setup:
# 1. Enable 2-Factor Authentication
# 2. Go to myaccount.google.com/apppasswords
# 3. Generate an app-specific password
# 4. Copy it to SMTP_PASS
```

### Logging

```env
# ===== LOGGING =====
LOG_LEVEL=debug                         # debug, info, warn, error
LOG_FILE=backend.log
```

### Optional Advanced Settings

```env
# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000             # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100             # Max requests per window

# ===== SESSION CONFIGURATION =====
SESSION_TIMEOUT=86400000                # 24 hours in ms

# ===== FILE UPLOADS =====
MAX_FILE_SIZE=52428800                  # 50MB in bytes
UPLOAD_DIR=uploads/

# ===== SECURITY =====
BCRYPT_ROUNDS=10                        # Password hash rounds (10-12 recommended)
```

## Frontend Configuration

### Location

```
frontend/.env
```

### Configuration

```env
# ===== API CONFIGURATION =====
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000                  # 30 seconds in ms

# ===== STRIPE PUBLISHABLE KEY =====
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# ===== ENVIRONMENT =====
VITE_ENV=development                    # development or production

# ===== FEATURE FLAGS =====
VITE_ENABLE_RECORDING=true
VITE_ENABLE_LIVE_STREAMING=true
VITE_ENABLE_CHAT=true
```

### Production Configuration

```env
# Update for production deployment
VITE_API_URL=https://api.edutalk.com
VITE_ENV=production
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
```

## Environment Setup by Stage

### Development

```env
# backend/.env (development)
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutalk
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

### Staging

```env
# backend/.env (staging)
NODE_ENV=staging
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/edutalk-staging
JWT_SECRET=generate_a_secure_secret_for_staging
STRIPE_SECRET_KEY=sk_test_... (test keys work for staging)
FRONTEND_URL=https://staging.edutalk.com
LOG_LEVEL=info
```

### Production

```env
# backend/.env (production)
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/edutalk-prod
JWT_SECRET=generate_a_secure_secret_for_production
STRIPE_SECRET_KEY=sk_live_... (LIVE keys only!)
STRIPE_PUBLISHABLE_KEY=pk_live_...
FRONTEND_URL=https://edutalk.com
LOG_LEVEL=warn
BCRYPT_ROUNDS=12  # Increase for production
```

## Security Guidelines

### ✅ DO

- ✅ Use strong, random values for JWT_SECRET
- ✅ Use different secrets for each environment
- ✅ Keep `.env` files out of version control
- ✅ Use production Stripe keys in production only
- ✅ Rotate secrets periodically
- ✅ Use environment variables for all secrets
- ✅ Use HTTPS URLs in production
- ✅ Enable rate limiting

### ❌ DON'T

- ❌ Commit `.env` files to git
- ❌ Use weak or simple secrets
- ❌ Share `.env` files via email or chat
- ❌ Use test keys in production
- ❌ Use production keys during development
- ❌ Hardcode secrets in code
- ❌ Log sensitive values
- ❌ Use HTTP in production

## Validating Configuration

### Test Backend Connection

```bash
cd backend
npm run dev
# Should show: "Connected to MongoDB" and "Server running on port 5000"
```

### Test Frontend Connection

```bash
cd frontend
npm run dev
# Should show: "Local: http://localhost:5173"
# Open in browser - should load without errors
```

### Test Stripe Connection

```bash
# In backend, make a test request
curl -X POST http://localhost:5000/api/payments/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### MongoDB Connection Failed

```
Error: ECONNREFUSED 127.0.0.1:27017
```

**Solution**:

- Ensure MongoDB is running
- Check MONGODB_URI is correct
- For Atlas: Check IP whitelist includes your IP

### Stripe Key Invalid

```
Error: Invalid API Key
```

**Solution**:

- Verify keys are copied completely
- Check key type matches environment (test for dev, live for prod)
- Regenerate keys if needed

### JWT Secret Not Set

```
Error: JWT_SECRET is not defined
```

**Solution**:

- Add JWT_SECRET to .env
- Restart server after changes

### Emails Not Sending

```
Error: SMTP connection failed
```

**Solution**:

- Verify SMTP credentials
- Check less secure apps allowed (Gmail)
- Check SendGrid API key is valid
- Verify firewall allows port 587

## Resetting Environment

To reset and start fresh:

```bash
# Remove current .env
rm backend/.env frontend/.env

# Copy from examples
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your values
code backend/.env
code frontend/.env

# Restart servers
npm run dev
```

## Common Values Reference

```env
# Quick Reference
STRIPE_TEST_CARD=4242424242424242
STRIPE_TEST_EXPIRY=1225 (any future date)
STRIPE_TEST_CVC=123 (any 3 digits)

# Common Ports
MongoDB: 27017
Backend: 5000
Frontend: 5173

# Token Formats
JWT_EXPIRE: 7d, 24h, 1w, 30d
RATE_LIMIT_WINDOW_MS: 60000 (1 min), 900000 (15 min), 3600000 (1 hour)
```

## Deployment Checklist

Before deploying to production:

- [ ] All required variables are set
- [ ] Secrets are strong and unique
- [ ] Using production Stripe keys
- [ ] Using production database (Atlas)
- [ ] LOG_LEVEL is set to warn or error
- [ ] FRONTEND_URL matches production domain
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] Backups are configured
- [ ] Monitoring is set up

---

For questions about specific services, see their documentation:

- [Stripe Docs](https://stripe.com/docs)
- [MongoDB Docs](https://docs.mongodb.com/)
- [SendGrid Docs](https://docs.sendgrid.com/)
- [OpenAI Docs](https://platform.openai.com/docs)
