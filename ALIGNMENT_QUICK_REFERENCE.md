# 🎯 EduTalk Alignment - Quick Reference

**Comparison: Current vs. Build Spec (from AI Assistant Prompts)**

---

## Critical Differences at a Glance

### 1️⃣ **Architecture**
```
CURRENT:                          SPEC (P1-00):
├── /backend (Express + MongoDB)  ├── /app (Next.js App Router)
│   ├── /src/routes               │   ├── /api (API routes)
│   ├── /src/models               │   ├── /dashboard
│   └── /src/controllers          │   ├── /host
│                                 │   └── /admin
├── /frontend (React + Vite)      │
│   ├── /src/pages                └── Single monorepo
│   ├── /src/components           
│   └── /src/utils
```

**Status:** ❌ INCOMPATIBLE - Must consolidate to single Next.js repo

---

### 2️⃣ **Tech Stack** (Side-by-Side)

| Layer | Current | Spec | Status |
|-------|---------|------|--------|
| **Backend Framework** | Express.js | Next.js 14 App Router | ❌ Change Required |
| **Frontend Build** | Vite | Next.js (built-in) | ❌ Change Required |
| **Database** | MongoDB | PostgreSQL | ❌ Change Required |
| **ORM** | Mongoose | Prisma | ❌ Change Required |
| **DB Host** | Local/Atlas | Supabase | ❌ Change Required |
| **Auth** | JWT + bcryptjs | Auth.js (NextAuth v5) | ❌ Missing |
| **Email** | SendGrid/Nodemailer | Resend + React Email | ⚠️ Migrate |
| **UI Components** | Custom CSS | shadcn/ui | ❌ Missing |
| **CSS** | Custom | Tailwind CSS | ⚠️ Migrate |
| **Payments** | Stripe only | Stripe + Paystack | ⚠️ Add Paystack |
| **Caching** | Unknown | Upstash Redis | ❌ Missing |
| **Analytics** | None | PostHog + Sentry | ❌ Missing |
| **Deployment** | TBD | Vercel | ⚠️ Configure |

**Legend:** ❌ = Critical, ⚠️ = Important, ✅ = OK

---

### 3️⃣ **Database Schema**

**Spec Defines 12+ Core Tables** (All must use PostgreSQL + Prisma):

```
✅ = Likely exists  |  ❌ = Unknown/Missing  |  ⚠️ = Needs verification

users ❓
  - id, email, password_hash, name, avatar_url, bio
  - timezone, preferred_currency, preferred_locale, preferred_theme
  - is_host BOOLEAN, is_admin BOOLEAN (additive flags, not single role)
  - stripe_customer_id, stripe_connect_id, paystack_recipient_code
  - host_plan (starter|growth|pro|elite), host_verified_level
  - referral_code, two_factor_secret, two_factor_enabled
  - is_active, strike_count

categories ❓
  - id, name, slug (unique), icon, parent_id (self-reference)

classes ✅
  - id, host_id, title, description, category_id, monthly_price_cents
  - currency, min_purchase_days (1|2|3|5|7 only)
  - duration_type (fixed|ongoing), start_date, end_date, total_days
  - max_students, thumbnail_url, intro_video_url
  - video_mode (builtin|external), external_link
  - status (draft|published|active|archived), visibility
  - tags, avg_rating, total_ratings, total_enrolled

class_schedules ❓
  - id, class_id, day_of_week (0-6), start_time, duration_minutes
  - timezone, is_active
  - (Multiple rows per class for recurring sessions)

class_sessions ✅
  - id, class_id, schedule_id, start_time, end_time
  - status (scheduled|live|completed|cancelled)
  - video_room_id, external_meeting_url, is_preview
  - actual_start, actual_end

subscriptions ✅
  - id, student_id, class_id, host_id, days_purchased, total_days_in_chain
  - start_date, end_date, amount_cents, daily_rate_cents, currency
  - chain_id (for continuation pricing), chain_sequence, previous_sub_id
  - auto_renew, auto_renew_days, status (pending|active|expired|cancelled|refunded)

access_codes ❌ CRITICAL
  - id, code (ET-XXXX-XXXX-XXXX unique), student_id, student_email
  - class_id, host_id, subscription_id
  - valid_from, valid_until, status (active|expired|revoked)
  - (Bound to email + class + date range + 3 trusted device fingerprints)

payments ❓
  - id, student_id, class_id, host_id, subscription_id, chain_id
  - amount_cents, platform_fee_cents, host_earning_cents, stripe_fee_cents
  - currency, charge_currency, charge_amount, exchange_rate
  - days_purchased, daily_rate_cents
  - is_continuation, continuation_discount_cents
  - stripe_payment_id, paystack_reference, status

reviews ❓
  - id, class_id, student_id, host_id, rating, text
  - category_ratings (JSON: teaching, pace, materials, engagement)
  - moderation_flags, verified_purchase

referrals ❌
  - id, referrer_id, referee_id, referral_code, status, credit_amount

admin_audit_logs ❌
  - id, admin_id, action, resource_type, resource_id, changes, timestamp

notifications ❌
  - id, user_id, event_type, title, body, read_at, preference_id
```

**Status:** ❌ **Schema must be completely rewritten in Prisma for PostgreSQL**

---

### 4️⃣ **Pricing Model (EXACT Spec)**

**The spec defines EXACT numbers that must match:**

```javascript
// Tier multipliers (monthly_price ÷ 30 × tier_multiplier)
PRICING_TIERS = {
  '1-3 days':   1.8,   // $100/month → $6.00/day
  '4-6 days':   1.5,   // $100/month → $5.00/day
  '7-13 days':  1.25,  // $100/month → $4.17/day
  '14-20 days': 1.1,   // $100/month → $3.67/day
  '21-30 days': 1.0    // $100/month → $3.33/day (capped at monthly)
};

// Continuation pricing (chunk buying without penalty)
// Example: 
//   Buy 3 days: charge $18
//   Later buy 5 days total: charge only $7 (not $25 fresh)
//   Later buy 22 days total: charge $66.67 (total = $100 monthly cap)
// Result: Student pays exactly $100, never more

// Commission by host plan tier
COMMISSION = {
  'starter':  0.25,  // 25%
  'growth':   0.20,  // 20%
  'pro':      0.15,  // 15%
  'elite':    0.10   // 10%
};

// Per-transaction payouts (not monthly settlements)
PAYOUT_HOLD = 1-3 days processing
RESERVE_HOLDBACK = 12.5% for 30-60 days
```

**Status:** ❌ **Pricing engine must implement EXACT numbers**

---

### 5️⃣ **Access Code System (ET- Format)**

**Spec Requirement:**
```
Format: ET-XXXX-XXXX-XXXX
Example: ET-K9QM-7B2L-R5WJ

Charset: 30 unambiguous characters (excludes 0/O, 1/I/L, etc.)
Combos: ~531 billion possible codes

Binding:
  - Student email (non-transferable)
  - Class ID
  - Valid date range
  - Up to 3 trusted device fingerprints
  - Status: active | expired | revoked

Usage:
  - Student gets code after payment
  - Code + email validates before joining
  - Device fingerprint checked (only 3 devices allowed)
  - If code invalid or devices full → reject join
```

**Status:** ❌ **Must implement with full device fingerprinting**

---

### 6️⃣ **Host Plan Tiers (Auto-Upgrade)**

**Spec Requirement:**

```
TIER         UNLOCK AT     FREE SLOTS  COMMISSION  FEATURE GATING
────────────────────────────────────────────────────────────────
Starter      Start          0 slots      25%        Basic features
  ↓
Growth       23 enrollments 5 slots      20%        Built-in rooms
  ↓
Pro          73 enrollments 15 slots     15%        Recording (Phase 2)
  ↓
Elite        198 enroll +   30 slots     10%        Advanced AI, 
             4.5★ rating                            Premium support

Auto-Upgrade: Triggered by enrollment count (or manual unlock in dashboard)
Feature Gating: Enforce which features available per tier
```

**Status:** ❌ **Auto-upgrade logic + feature gating must be implemented**

---

### 7️⃣ **Payment Processors (Dual Routing)**

**Spec Requirement:**

```
PRIMARY:   Stripe (International)
SECONDARY: Paystack (African markets: Nigeria, Ghana, South Africa, Kenya)

ROUTING LOGIC:
  if region in [NG, GH, ZA, KE] → Paystack
  else if currency in [NGN, GHS, ZAR, KES] → Paystack
  else → Stripe

PER-TRANSACTION PAYOUTS:
  Total Sale: $100
  Stripe Fee: ~$2.90 + $0.30 = $3.20
  Platform Fee (Growth tier): $20
  Holdback (12.5%): $12.50
  Host Payout (Immediate): $64.30 (flagged for payout)
  Reserve (30-60 days): $12.50

COMMISSION SPLIT (Growth @ $100 sale):
  Stripe processes: keeps $3.20
  Platform receives: $20.00 (20% of $100)
  Host earns: $100 - $20 - $3.20 = $76.80 immediately
  Reserve: $12.50 held 30-60 days
```

**Status:** ❌ **Dual routing + complex split calculation must be implemented**

---

### 8️⃣ **API Endpoints (Sample from Spec)**

**Authentication (P1-02):**
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/magic-link
POST /api/auth/oauth/google
POST /api/auth/oauth/callback
POST /api/auth/verify-email
POST /api/auth/refresh-token
GET  /api/auth/profile (protected)
PUT  /api/auth/profile (protected)
```

**Classes (P1-08):**
```
GET  /api/classes (browse)
GET  /api/classes/:classId
POST /api/classes (host only)
PUT  /api/classes/:classId (host only)
DELETE /api/classes/:classId (host only)
GET  /api/classes/my-classes (host)
```

**Payments (P1-13, P1-14):**
```
POST /api/payments/create-intent
POST /api/payments/confirm
GET  /api/payments/history (protected)
GET  /api/payments/continuation-pricing (POST with chain details)
```

**Status:** ❌ **All endpoints must be Next.js API routes (/app/api/...)**

---

### 9️⃣ **AI Features (Phase 1 - Limited Scope)**

**Spec Requirement: Exactly 3 features (not more, not less)**

```
FEATURE 1: Chat-Based Summaries (lite)
  - Generate from session chat transcript
  - Use OpenAI API (GPT-4)
  - Cache summaries in Redis
  - Budget cap: $0.10 per summary max
  - Fallback: Display raw transcript if error

FEATURE 2: Chat Moderation (flag-mode only)
  - Scan session chat for violations
  - Flag (don't auto-block) suspicious messages
  - Host reviews flagged messages
  - Store moderation log
  - Phase 2 adds: auto-block tiers (hard violations)

FEATURE 3: Quiz Generation
  - Generate multiple-choice questions from summaries
  - Store questions + answers
  - Track student responses
  - Phase 2 adds: scheduled quizzes, leaderboards, transcript-based
```

**Status:** ⚠️ **Phase 1 limited AI; Phase 2 and 3 expand scope**

---

## Summary: 21 Critical + 25 High-Priority Misalignments

### Priority 1 (CRITICAL - 21 items):
- Complete tech stack overhaul (5)
- Database migration (8)
- Auth system redesign (1)
- Pricing engine (1)
- Access codes (1)
- Payment routing (1)
- Email service (1)
- Plan tiers (1)
- API architecture (1)

### Priority 2 (HIGH - 25 items):
- Paystack integration (1)
- Multi-currency (1)
- Redis caching (1)
- Analytics (1)
- Multi-class checkout (1)
- Refund engine (1)
- Notifications (1)
- Admin panel (1)
- No-show handling (1)
- Plus 16 more...

### Priority 3 (PHASE 2+ - 4 items):
- Recording pipeline
- Enhanced AI features
- Advanced ban-evasion
- Stability hardening

---

## Recommended Action

### Option A: Start Fresh (Recommended)
1. Initialize new Next.js 14 project
2. Setup Prisma + Supabase
3. Migrate essential data
4. Rebuild features in Next.js stack
5. **Timeline:** 4-6 weeks for MVP

### Option B: Hybrid (Risky)
1. Keep Express backend, add Next.js frontend
2. Use API bridge layer
3. Risk: Technical debt, complexity
4. Not recommended

### Option C: Continue Current Path (Not Viable)
1. Ignore spec misalignments
2. Code already written won't match prompts
3. Risk: Complete rewrite later
4. **Not recommended**

---

## Next Steps

1. **Review this analysis** with team
2. **Make decision:** Fresh start vs. hybrid approach
3. **If fresh start:** Begin with NEXT_STEPS.md in this folder
4. **If hybrid:** Document API bridge layer extensively

---

**Analysis Date:** August 29, 2026  
**Alignment Level:** 0% (completely different tech stack)  
**Recommendation:** Fresh start with Next.js 14 stack
