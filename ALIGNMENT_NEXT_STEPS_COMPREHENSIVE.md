# 🎯 EduTalk Specification Alignment - Comprehensive Action Plan

**Date:** August 29, 2026  
**Analysis:** Complete Build Spec vs Current Implementation  
**Status:** Ready to Begin Alignment Phase  

---

## What We Discovered

### Current State (Separate Repos Architecture)
```
Current Implementation:
├── backend/ (Node.js + Express + MongoDB)
├── frontend/ (React 18 + Vite + React Router)
└── Separate API/UI architecture
```

### Build Spec Requirement (Monorepo Architecture)
```
Spec Requirement (P1-00):
└── Single Next.js 14 App Router
    ├── /app (routes + frontend)
    ├── /app/api (API routes)
    ├── /lib (utilities & services)
    ├── /components (UI components)
    ├── /prisma (database schema)
    └── /emails (Resend templates)
```

### Alignment Score: 0%
- **Tech Stack:** Completely different (Express/MongoDB vs Next.js/PostgreSQL)
- **Architecture:** Opposite (separate repos vs monorepo)
- **Features:** Partial (~40% implemented, misaligned on pricing/payments)
- **Database:** Wrong engine (MongoDB vs PostgreSQL with Prisma)

---

## Critical Path Analysis

### 🚨 BLOCKER Issues (Must Fix First)

| # | Issue | Impact | Timeline |
|---|-------|--------|----------|
| 1 | Wrong tech stack (Express → Next.js) | ALL code affected | 2 weeks setup |
| 2 | Wrong database (MongoDB → PostgreSQL) | ALL data affected | 1 week migration |
| 3 | Missing NextAuth v5 | Auth broken on spec | 3 days |
| 4 | Missing exact pricing tiers | Payment calculations wrong | 3 days |
| 5 | Missing access code system | Can't validate joins | 2 days |
| 6 | Missing Paystack integration | Africa market blocked | 3 days |
| 7 | Missing shadcn/ui components | UI inconsistent | 1 day |

---

## Decision Required: Two Paths Forward

### Path A: Complete Rewrite (RECOMMENDED ⭐⭐⭐)
**Start fresh with Next.js 14 matching spec exactly**

**Pros:**
- ✅ Clean, modern architecture
- ✅ All code built to spec from day 1
- ✅ No legacy code to migrate
- ✅ Better performance (Next.js benefits)
- ✅ Easier debugging
- ✅ Native Vercel deployment

**Cons:**
- ❌ Lose 2-3 weeks of current work
- ❌ Must migrate data
- ❌ Requires new project setup

**Timeline:** 6 weeks to MVP  
**Effort:** 2-3 dev equivalent  
**Risk:** Low (clear spec)

---

### Path B: Hybrid Approach (NOT RECOMMENDED ⚠️)
**Keep Express backend, migrate frontend to Next.js, bridge with API**

**Pros:**
- ✅ Preserve some backend code
- ✅ Faster initial setup

**Cons:**
- ❌ Complex API bridge layer
- ❌ Two different codebases to maintain
- ❌ Still requires rewrite later
- ❌ Technical debt accumulates
- ❌ Harder to follow spec prompts
- ❌ Spec assumes single repo

**Timeline:** 8-10 weeks (takes longer!)  
**Effort:** 3-4 dev equivalent  
**Risk:** High (increasing complexity)

---

### 🏆 RECOMMENDATION: Path A (Complete Rewrite)

**Why:**
1. Spec is precise and assumes Next.js monorepo
2. Current architecture blocks every feature
3. Rewrite faster than continuous patching
4. Better long-term maintainability
5. Follow prompts P1-00 through P1-33 sequentially

**Decision Point:** Proceed with Path A or Path B?

---

## Phase-by-Phase Roadmap (Path A)

### PHASE 1: Foundation (Weeks 1-2)

#### Week 1: Setup & Bootstrap
**Day 1-2: Project Initialization**
```bash
# Create new Next.js project
npx create-next-app@latest edutalk \
  --typescript \
  --tailwind \
  --app-router \
  --no-git

cd edutalk
git init
git add .
git commit -m "Initial Next.js 14 scaffold"
```

**Checklist:**
- [ ] Create .env.local with all variables
- [ ] Install Prisma + seed script
- [ ] Setup Supabase PostgreSQL connection
- [ ] Install shadcn/ui core components
- [ ] Create landing page with tagline
- [ ] Implement `/api/health` endpoint
- [ ] Setup GitHub Actions for CI/CD
- [ ] Configure Vercel deployment

**Acceptance:** 
```bash
npm run dev  # Runs on localhost:3000
curl http://localhost:3000/api/health  # Returns { status: 'ok' }
```

**Day 3: Database Setup**
```bash
# Initialize Prisma
npx prisma init

# Create complete schema (see PRISMA_SCHEMA_COMPLETE.md)
# Update DATABASE_URL in .env.local

# Create migrations
npx prisma migrate dev --name init

# Populate seed data
npx prisma db seed
```

**Acceptance:**
```bash
npx prisma studio  # Shows all tables with sample data
```

**Day 4-5: Authentication Infrastructure**
- [ ] Install @auth/nextjs, resend, react-email
- [ ] Create `/app/api/auth/[...nextauth]/route.ts`
- [ ] Setup email provider with Resend
- [ ] Create NextAuth callback functions
- [ ] Email template directory with signup/verification emails

**Acceptance:**
- POST /api/auth/signin (email/password)
- Verification email sent
- Email link validates account
- User can login

---

#### Week 2: Authentication Complete + First APIs
**Day 1-2: Auth Flows**
- [ ] Google OAuth provider setup
- [ ] Magic link flow with Resend
- [ ] Email verification validation
- [ ] JWT refresh token endpoint
- [ ] Password reset flow
- [ ] User profile endpoint (GET /api/auth/profile)

**Day 3: Pricing Engine**
- [ ] Create `/lib/pricing.ts` with EXACT tier logic
- [ ] Implement continuation chain calculation
- [ ] Create `/api/pricing/calculate` endpoint
- [ ] Comprehensive unit tests (Vitest)

**Test Cases:**
```typescript
// These MUST pass exactly
test('$100/month, 1-3 days = $18', () => {
  expect(calculatePrice(100, 3)).toBe(18);
});

test('$100/month, 4-6 days = $25', () => {
  expect(calculatePrice(100, 6)).toBe(25);
});

test('continuation: 3d@$18 then 5d total = charge $7', () => {
  const cont = calculateContinuation(
    { days: 3, paid: 18 },
    5, // new total
    100 // monthly
  );
  expect(cont).toBe(7);
});
```

**Day 4-5: Access Code System**
- [ ] Create `/lib/access-codes.ts`
- [ ] Generate `ET-XXXX-XXXX-XXXX` format (30-char charset)
- [ ] Implement device fingerprinting logic
- [ ] Create `/api/access-codes/validate` endpoint
- [ ] Store trusted devices (max 3 per subscription)
- [ ] Tests for edge cases (expired, device limit, invalid format)

**Acceptance:**
```bash
# Generate code
POST /api/access-codes/generate
{ studentEmail: "user@example.com", classId: "c123", days: 7 }
# Returns: { code: "ET-K9QM-7B2L-R5WJ", validUntil: "2026-09-05" }

# Validate code
POST /api/access-codes/validate
{ code: "ET-K9QM-7B2L-R5WJ", email: "user@example.com", deviceFp: "..." }
# Returns: { valid: true } or { valid: false, reason: "expired" }
```

**Commit:** `feat: authentication flows, pricing engine, access codes`

---

### PHASE 2: Payment Systems (Weeks 3-4)

#### Week 3: Stripe Integration
**Day 1-2: Stripe Setup**
- [ ] Install stripe SDK
- [ ] Create `/lib/stripe.ts` with Stripe client initialization
- [ ] Create `/app/api/payments/create-intent` endpoint
- [ ] Implement webhook handler at `/app/api/webhooks/stripe`
- [ ] Commission calculation (platform fee, Stripe fee, host earning)
- [ ] Reserve holdback tracking (12.5% for 30-60 days)

**Test:**
```bash
# Create payment intent
POST /api/payments/create-intent
{
  "classId": "c123",
  "days": 5,
  "studentEmail": "user@example.com"
}

# Webhook (simulated)
POST /api/webhooks/stripe
{
  "type": "payment_intent.succeeded",
  "data": { "object": { "id": "pi_..." } }
}
# Should create subscription + access code
```

**Day 3-4: Payment Commission Splits**
- [ ] Implement exact formula: platform fee % varies by host plan
- [ ] Stripe fee calculation (~2.9% + $0.30)
- [ ] Host immediate payout calculation
- [ ] Reserve amount tracking
- [ ] Payment ledger with all breakdowns

**Example ($100 sale, Growth tier = 20% commission):**
```
Total Sale:        $100.00
Stripe Fee:        -$3.20  (2.9% + $0.30)
Platform Fee:      -$20.00 (20% for Growth)
Reserve (12.5%):   -$12.50 (held 30-60 days)
Host Immediate:    $64.30  (paid within 1-3 days)
```

**Day 5: Testing**
- [ ] Unit tests for commission calculation
- [ ] Integration tests for payment flow
- [ ] Webhook processing tests

---

#### Week 4: Paystack Integration + Smart Routing
**Day 1-2: Paystack Setup**
- [ ] Install paystack SDK
- [ ] Create `/lib/paystack.ts`
- [ ] Implement Paystack checkout flow
- [ ] Webhook handler for Paystack

**Day 3: Smart Routing**
- [ ] Create payment routing logic: Stripe vs Paystack
- [ ] Detect region (NG, GH, ZA, KE) → Paystack
- [ ] Detect currency (NGN, GHS, ZAR, KES) → Paystack
- [ ] Default to Stripe
- [ ] Create `/api/payments/route-payment` decision endpoint

**Day 4: Multi-Currency Support**
- [ ] Real-time exchange rates (cache in Redis)
- [ ] Convert pricing to student's preferred currency
- [ ] Store exchange_rate in payment record
- [ ] Display pricing in student dashboard

**Day 5: Integration Testing**
- [ ] Test Stripe payment flow
- [ ] Test Paystack payment flow
- [ ] Test routing logic
- [ ] Commission calculation validation

**Commit:** `feat: dual-processor payment system (Stripe + Paystack)`

---

### PHASE 3: Core Features (Weeks 5-6)

#### Week 5: Host Plan Tiers + Class Management
**Day 1-2: Host Plan Tier System**
- [ ] Implement plan auto-upgrade logic
  - Starter (0 enrollments) → 0 free slots, 25% commission
  - Growth (23 enrollments) → 5 free slots, 20% commission
  - Pro (73 enrollments) → 15 free slots, 15% commission
  - Elite (198 enrollments + 4.5★) → 30 free slots, 10% commission
- [ ] Create `/api/host/upgrade-plan` endpoint
- [ ] Feature gating per plan (built-in rooms for Growth+, recording for Pro+)
- [ ] Dashboard showing plan progress

**Day 3-4: Class CRUD + Scheduling**
- [ ] POST `/api/classes` - Create class
- [ ] GET `/api/classes/:classId` - Read class
- [ ] PUT `/api/classes/:classId` - Update class
- [ ] DELETE `/api/classes/:classId` - Delete class
- [ ] POST `/api/classes/:classId/schedule` - Define weekly schedule
- [ ] Auto-generate class sessions from schedule

**Class fields (MUST match spec exactly):**
```typescript
interface Class {
  id: string;
  hostId: string;
  title: string; // max 500 chars
  description: string;
  categoryId: string;
  monthlyPrice: number; // in cents
  currency: string; // default "USD"
  minPurchaseDays: 1 | 2 | 3 | 5 | 7;
  durationType: "fixed" | "ongoing";
  startDate?: Date;
  endDate?: Date;
  maxStudents: number;
  status: "draft" | "published" | "active" | "archived";
  visibility: "public" | "unlisted";
  videoMode: "builtin" | "external";
  externalLink?: string;
  thumbnailUrl?: string;
  tags: string[];
  avgRating: number; // 0-5
  totalRatings: number;
  totalEnrolled: number;
}
```

**Day 5: Testing + Documentation**
- [ ] E2E tests for class creation
- [ ] Validate field constraints
- [ ] Test schedule generation

**Commit:** `feat: host plan tiers and class management (CRUD, scheduling)`

---

#### Week 6: Enrollment + Discovery + Admin Basics
**Day 1-2: Enrollment System**
- [ ] POST `/api/classes/:classId/enroll` - Create subscription
- [ ] GET `/api/my-subscriptions` - Student's active classes
- [ ] Join validation (check access code + date range)
- [ ] Generate access codes on successful payment
- [ ] Auto-cleanup expired access codes (cron job)

**Day 3: Class Discovery**
- [ ] GET `/api/classes` - Browse with filters
- [ ] Search by title, description, tags (full-text)
- [ ] Filter by category, price range, schedule
- [ ] Sort by rating, enrollment, newest
- [ ] Pagination (limit 20, offset)
- [ ] Host profile page with all classes + ratings

**Day 4: Admin Panel (Basic)
- [ ] 3 MVP roles: Support, Admin, SuperAdmin
- [ ] Route protection with RBAC middleware
- [ ] Admin dashboard (view users, classes, payments)
- [ ] Audit log (track all sensitive actions)
- [ ] Strike system (report violations, escalate)

**Day 5: Testing + E2E**
- [ ] Full enrollment flow E2E test
- [ ] Payment → access code → join
- [ ] Search functionality
- [ ] Admin access control

**Commit:** `feat: enrollment, class discovery, basic admin panel`

---

### PHASE 4: Phase 1 Completion (Week 7)

**Features to finalize:**
- [ ] Ratings & reviews (5-star, category ratings)
- [ ] Notifications (email + in-app matrix)
- [ ] User settings (preferred currency, locale, theme)
- [ ] PWA setup (installable, offline)
- [ ] Monitoring (Sentry + PostHog)
- [ ] Deployment to Vercel

**Testing:**
- [ ] Unit test coverage ≥ 80%
- [ ] E2E tests for critical paths
- [ ] Load testing with k6 (SLO: p95 < 2s)

**Acceptance Criteria (All must be GREEN):**
```
✅ User can register with email, verify, login
✅ Host can create class with pricing and schedule
✅ Student can browse, search, filter classes
✅ Student can enroll and pay via Stripe (US) or Paystack (Africa)
✅ Access code generated, validated, and enforced
✅ Host receives payout within 1-3 days
✅ 12.5% reserve tracked separately
✅ Host auto-upgrades to Growth at 23 enrollments
✅ Plan tier features gated correctly
✅ Admin can view all users, classes, payments with audit log
✅ Health check endpoint returns 200 OK
✅ App deploys to Vercel without errors
✅ All pricing tiers calculate EXACTLY as spec (e.g., 1-3d=$18 for $100/month)
✅ Access codes have ET-XXXX-XXXX-XXXX format
✅ Device fingerprinting limits to 3 trusted devices
```

**Commit:** `feat: Phase 1 MVP complete (P1-00 through P1-08 prompts)`

---

## Data Migration Plan

### Step 1: Export Current Data
```bash
# From current MongoDB
mongoexport --db edutalk --collection users --out users.json
mongoexport --db edutalk --collection classes --out classes.json
mongoexport --db edutalk --collection subscriptions --out subscriptions.json
mongoexport --db edutalk --collection payments --out payments.json
```

### Step 2: Transform for PostgreSQL
- Create migration scripts in `/scripts/migrate-*.js`
- Map MongoDB ObjectId → UUID
- Hash plaintext passwords if needed
- Validate all relationships

### Step 3: Seed Postgres
```bash
# Run migration scripts
node scripts/migrate-users.js
node scripts/migrate-classes.js
node scripts/migrate-subscriptions.js
node scripts/migrate-payments.js

# Verify
npx prisma studio  # Check all data loaded
```

### Step 4: Backup & Rollback
```bash
# Keep MongoDB backup
mongodump --db edutalk --out ./backups/edutalk-backup

# Document restore procedure
# (In case PostgreSQL migration fails)
```

---

## Dependency Summary

### Core Stack
```json
{
  "next": "^14.0.0",
  "react": "^18.3.0",
  "react-dom": "^18.3.0",
  "typescript": "^5.0.0",
  "@prisma/client": "latest",
  "prisma": "latest"
}
```

### Authentication & Security
```json
{
  "@auth/core": "latest",
  "@auth/nextjs": "latest",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0"
}
```

### UI & Styling
```json
{
  "tailwindcss": "^3.0.0",
  "autoprefixer": "^10.0.0",
  "postcss": "^8.0.0",
  "shadcn-ui": "latest",
  "@hookform/resolvers": "latest",
  "react-hook-form": "latest"
}
```

### Payments
```json
{
  "stripe": "^13.0.0",
  "paystack": "latest"
}
```

### Email & Communication
```json
{
  "resend": "latest",
  "react-email": "latest",
  "node-cron": "^3.0.0"
}
```

### Caching & Performance
```json
{
  "@upstash/redis": "latest"
}
```

### Monitoring & Analytics
```json
{
  "@sentry/nextjs": "latest",
  "posthog": "latest"
}
```

### Utilities
```json
{
  "zod": "^3.0.0",
  "uuid": "^9.0.0",
  "ua-parser-js": "^1.0.0",
  "axios": "latest"
}
```

---

## Git Workflow & Commits

### Initial Setup
```bash
git init edutalk-next
cd edutalk-next
git add .
git commit -m "Initial Next.js 14 scaffold with Prisma

- TypeScript strict mode
- Tailwind CSS + shadcn/ui
- Prisma ORM + Supabase PostgreSQL
- App Router architecture
- Health check endpoint

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

### Per-Feature Branch Pattern
```bash
# Each feature gets its own branch
git checkout -b feat/authentication
git checkout -b feat/pricing-engine
git checkout -b feat/stripe-integration
git checkout -b feat/class-management

# Commit after acceptance criteria met
git commit -m "feat: <description>

What:
- Implemented X, Y, Z

Why:
- Required by spec P1-XY

Testing:
- Unit tests: 12/12 pass
- E2E tests: 5/5 pass

Acceptance:
- ✅ All criteria met

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Communication & Status Tracking

### Weekly Status Updates
```markdown
**Week N: [Feature]**

Completed:
- ✅ Item A
- ✅ Item B

In Progress:
- 🔄 Item C

Blockers:
- 🚨 (if any)

Next Week:
- [ ] Item D
- [ ] Item E
```

### Acceptance Testing Checklist
Before marking feature complete, verify:
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing complete
- [ ] Code review approved
- [ ] Spec acceptance criteria met

---

## Success Metrics (Phase 1 Exit)

**Technical:**
- ✅ All 21 critical alignment items resolved
- ✅ TypeScript strict mode enforced
- ✅ 80%+ unit test coverage
- ✅ E2E tests for all critical paths
- ✅ Sentry + PostHog monitoring active
- ✅ Database indexed for performance
- ✅ Zero security vulnerabilities (dependency audit)

**Functional:**
- ✅ All spec features working (auth, pricing, payments, access codes, etc.)
- ✅ Admin panel operational with RBAC
- ✅ Host dashboard with analytics
- ✅ Student dashboard with class list
- ✅ Payment processing (Stripe + Paystack) live

**Business:**
- ✅ Can demo to stakeholders
- ✅ Ready for beta user testing
- ✅ Deployable to production (Vercel)
- ✅ Monitoring & alerting configured

---

## Next Steps After MVP

### Phase 2 (Weeks 8-11)
Implement high-priority features from prompts P2-01 through P2-06:
- Session recording pipeline
- Recording playback
- Enhanced analytics
- Full host abandonment protection
- Rolling holdback automation
- Ban-evasion upgrade

### Phase 3+ (Months 4+)
- Advanced AI features
- Multi-language support
- Mobile native apps
- Advanced compliance (GDPR, CCPA)

---

## Decision Required NOW

### Which path to proceed?

1. **Path A: Complete Rewrite (Recommended)**
   - [ ] Approved - Start fresh with Next.js 14
   - [ ] Timeline: 6 weeks to MVP
   - [ ] Start: Immediate

2. **Path B: Hybrid (Not Recommended)**
   - [ ] Approved - Keep Express, bridge with Next.js
   - [ ] Timeline: 8-10 weeks
   - [ ] Risk: Higher technical debt

3. **Path C: Continue Current**
   - [ ] Not viable - Will need rewrite later anyway
   - [ ] Not recommended

---

## Resources Needed

### People
- [ ] 1 Full-stack engineer (primary)
- [ ] 1 Backend engineer (payment systems)
- [ ] 1 QA engineer (testing)
- [ ] PM/Tech lead (oversight)

### Infrastructure
- [ ] Supabase PostgreSQL (free tier OK for MVP)
- [ ] Vercel account (free tier OK)
- [ ] Upstash Redis (free tier OK)
- [ ] Stripe account (test keys)
- [ ] Paystack account (test keys)
- [ ] Resend account (free tier OK)
- [ ] Sentry account (free tier OK)
- [ ] PostHog account (free tier OK)

### Time
- [ ] 6 weeks (Path A) or 8-10 weeks (Path B)
- [ ] ~240-300 hours developer time
- [ ] ~60 hours QA/testing
- [ ] ~40 hours PM/oversight

---

## Final Recommendation

### 🚀 PROCEED WITH PATH A (Complete Rewrite)

**Why:**
1. ✅ Spec is crystal clear (47 detailed prompts)
2. ✅ Current architecture incompatible with spec
3. ✅ Rewrite faster than patching (6 weeks vs 8-10)
4. ✅ Lower risk with clear acceptance criteria
5. ✅ Better codebase for team to maintain
6. ✅ Can follow prompts P1-00 through P1-33 sequentially

**Start Date:** ASAP (today if possible)
**First Task:** Run initialization commands above
**First Milestone:** Week 1 project scaffold complete

---

**Document:** ALIGNMENT_NEXT_STEPS.md  
**Status:** Ready for Approval  
**Created:** August 29, 2026  
**Decision Required:** Path A vs Path B  

👉 **Ready to start? Confirm decision and run first commands!**
