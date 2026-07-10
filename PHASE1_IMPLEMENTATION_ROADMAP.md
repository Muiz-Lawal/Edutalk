# 🚀 EduTalk Phase 1 (MVP) Implementation Roadmap

**Duration:** 5-6 weeks  
**Target:** Live, production-ready platform  
**Status:** Starting  

---

## Phase 1 MVP Core Requirements

From EDUTALK_COMPLETE_SPECIFICATION.md, Phase 1 must include:

✅ User authentication & profiles  
✅ Flexible pricing system (tiered daily rates)  
✅ Stripe & Paystack integration  
✅ Access codes and device verification  
✅ Class creation and browsing  
✅ Payment processing and fulfillment  
✅ Basic video (external links)  
✅ Basic analytics  
✅ Admin foundation  
✅ Support system  

**NOT in Phase 1:**
- Built-in video conferencing
- Session recording
- Host ranking system
- Course bundles
- Multi-language
- Advanced moderation

---

## Week-by-Week Breakdown

### Week 1: Foundation & Authentication
**Goal:** Core auth system, user profiles, database models

#### Tasks:
- [ ] **Backend Setup**
  - [ ] Configure MongoDB connection (local + Atlas)
  - [ ] Set up Express middleware stack
  - [ ] Create JWT secret management (.env)
  - [ ] Implement error handling middleware
  - [ ] Set up CORS configuration

- [ ] **User Models**
  - [ ] Create User schema (email, password, name, role, profile)
  - [ ] Add Student schema fields (bio, interests, preferences)
  - [ ] Add Host schema fields (expertise, bio, bank_account)
  - [ ] Create authentication indexes

- [ ] **Authentication API**
  - [ ] POST /api/auth/register - Student signup
  - [ ] POST /api/auth/login - Login with email/password
  - [ ] POST /api/auth/refresh - Token refresh
  - [ ] GET /api/auth/profile - Get current user
  - [ ] PUT /api/auth/profile - Update profile
  - [ ] POST /api/auth/logout - Clear tokens

- [ ] **Password Security**
  - [ ] Implement bcryptjs hashing
  - [ ] Add password validation rules
  - [ ] Create password reset flow (skeleton)

- [ ] **Frontend Auth**
  - [ ] Create AuthContext for global state
  - [ ] Build LoginPage component
  - [ ] Build RegisterPage component
  - [ ] Build ProfilePage component
  - [ ] Implement auth token storage (localStorage)
  - [ ] Create protected route wrapper

**Deliverable:** Users can register, login, view/edit profiles. JWT tokens working.

---

### Week 2: Host Setup & Class Model
**Goal:** Hosts can create classes with pricing configuration

#### Tasks:
- [ ] **Host Upgrade Flow**
  - [ ] POST /api/auth/upgrade-to-host - Convert user to host
  - [ ] Collect host expertise/bio
  - [ ] Validate Stripe Connect info (store token, don't validate connection yet)

- [ ] **Class Schema**
  - [ ] Create Class model:
    - title, description, category, tags
    - host_id, pricing (monthlyPrice)
    - minPurchaseDays, classType (fixed/ongoing)
    - schedule (days, times, duration, timezone)
    - status (draft, active, paused, ended)
    - maxStudents, currentEnrollment
    - videoMode (external/builtin)
    - previewVideoUrl

- [ ] **Class API - Create**
  - [ ] POST /api/classes - Create class (host only)
  - [ ] Validate pricing input
  - [ ] Validate schedule
  - [ ] Save class in draft state

- [ ] **Class API - Manage**
  - [ ] PUT /api/classes/:classId - Update class
  - [ ] DELETE /api/classes/:classId - Delete class
  - [ ] GET /api/classes/my-classes - List host's classes
  - [ ] PATCH /api/classes/:classId/activate - Publish class

- [ ] **Session Schema & Generation**
  - [ ] Create Session model (classId, startTime, endTime, status)
  - [ ] Create logic to generate sessions from schedule
  - [ ] Handle recurring sessions

- [ ] **Host Dashboard Frontend**
  - [ ] Create HostDashboard component
  - [ ] Build class creation form (title, description, category)
  - [ ] Build pricing section (monthly price, min days)
  - [ ] Build schedule builder
  - [ ] Display created classes list
  - [ ] Show class status (draft/active/paused)

**Deliverable:** Hosts can create classes with pricing. Sessions auto-generate from schedule.

---

### Week 3: Student Browsing & Pricing
**Goal:** Students can discover classes and see dynamic pricing

#### Tasks:
- [ ] **Class Browse API**
  - [ ] GET /api/classes - List classes with filters
    - category filter
    - price range filter
    - searchText filter
    - pagination
  - [ ] GET /api/classes/:classId - Full class details
  - [ ] Calculate pricing tiers in response

- [ ] **Pricing Engine**
  - [ ] Implement tiered rate calculator:
    ```
    1-3 days:   1.8x multiplier
    4-6 days:   1.5x multiplier
    7-13 days:  1.25x multiplier
    14-20 days: 1.1x multiplier
    21-30 days: 1.0x multiplier
    ```
  - [ ] Create utils/pricing.js with calculation functions
  - [ ] Handle fixed-duration started classes (cap max days)
  - [ ] Test pricing edge cases

- [ ] **Continuation Pricing (chunk buying)**
  - [ ] Create PaymentChain schema
  - [ ] Implement continuation price logic:
    - fresh price vs continuation price
    - always give student lower price
  - [ ] Store payment history per student-class

- [ ] **Browse & Discovery Frontend**
  - [ ] Create ClassListPage component
  - [ ] Build category filters
  - [ ] Build price range filter
  - [ ] Build search
  - [ ] Display class cards (thumbnail, host, rating, students, price)
  - [ ] Add pagination

- [ ] **Class Details Page**
  - [ ] Display full description
  - [ ] Show complete schedule
  - [ ] List all sessions
  - [ ] Build enrollment card with:
    - Slider for day selection
    - Real-time price calculation
    - Date range display
    - Save discount indicator
  - [ ] Show host profile

**Deliverable:** Students can browse, search, and see dynamic pricing. Prices update in real-time.

---

### Week 4: Payment Integration (Stripe & Paystack)
**Goal:** Students can pay and receive access codes

#### Tasks:
- [ ] **Stripe Setup**
  - [ ] Get Stripe API keys (test mode)
  - [ ] Create Stripe configuration
  - [ ] Set up webhooks endpoint for payment.intent.succeeded
  - [ ] Test payment flow with test card (4242 4242 4242 4242)

- [ ] **Paystack Setup**
  - [ ] Get Paystack API keys (test mode)
  - [ ] Create Paystack configuration
  - [ ] Set up webhooks endpoint for charge.success
  - [ ] Test payment flow with Paystack test account

- [ ] **Payment Intent API**
  - [ ] POST /api/payments/create-intent
    - Input: classId, numDays, studentId
    - Calculate total price (using pricing engine)
    - Calculate commission split:
      - Platform: 25% (Starter plan)
      - Stripe fee: ~2.9% + $0.30
      - Host: remainder
    - Determine payment processor (Stripe vs Paystack)
    - Create payment intent
    - Return intent ID + client secret

- [ ] **Access Code Generation**
  - [ ] Create AccessCode schema:
    - code (PC-XXXX-XXXX-XXXX format)
    - studentEmail
    - classId
    - dateRange (startDate, endDate)
    - deviceFingerprints (up to 3 trusted devices)
    - status (active, expired, revoked)
  - [ ] Implement 30-character base code generation
    - Base: A-Z (no O, I, L) + 2-9 (no 0, 1)
    - 12 positions = ~531 billion combinations
  - [ ] Create utils/accessCode.js generator

- [ ] **Device Fingerprinting**
  - [ ] Install browser fingerprinting library (fpjs or similar)
  - [ ] Capture device fingerprint on payment creation
  - [ ] Store fingerprint with access code
  - [ ] Create device fingerprint validation on join

- [ ] **Payment Confirmation API**
  - [ ] POST /api/payments/confirm
    - Input: paymentIntentId
    - Verify payment succeeded
    - Create Subscription record
    - Generate access code
    - Record in PaymentChain
    - Send confirmation email (skeleton)

- [ ] **Payment History API**
  - [ ] GET /api/payments/history (user's payment history)
  - [ ] GET /api/payments/by-host (host's received payments)
  - [ ] Store payment commission breakdown

- [ ] **Frontend Payment Form**
  - [ ] Create PaymentPage component
  - [ ] Integrate Stripe.js
  - [ ] Integrate Paystack.js
  - [ ] Build payment form with:
    - Card details
    - Email confirmation
    - Total price display
    - Commission transparency
  - [ ] Handle payment success/error
  - [ ] Show access code after payment
  - [ ] Copy-to-clipboard for access code

**Deliverable:** End-to-end payment flow working. Students get access codes after payment.

---

### Week 5: Access Control & Expiration
**Goal:** Students can join sessions, expiration enforced

#### Tasks:
- [ ] **Subscription Schema**
  - [ ] Create Subscription model:
    - studentId, classId
    - accessCodeId
    - purchasedDays, dateRange
    - status (active, expired, suspended)
    - auto-renewal enabled flag
    - paymentHistory reference

- [ ] **Session Join Validation API**
  - [ ] POST /api/sessions/:sessionId/validate-access
    - Input: studentId, sessionId, accessCode, deviceFingerprint
    - Check: student logged in ✓
    - Check: access code valid ✓
    - Check: code matches email ✓
    - Check: date in range ✓
    - Check: device fingerprint matches (or new device flow)
    - Check: session is live/in 15-min early join window ✓
    - Return: access granted or specific error

- [ ] **Device Fingerprint Verification**
  - [ ] Implement new device flow:
    - Detect unrecognized device
    - Prompt user for email verification or OTP
    - Allow up to 3 devices per access code
    - Block 4th device until verified

- [ ] **Expiration Handling**
  - [ ] Daily cron job to mark expired access codes
  - [ ] Check subscription end date daily
  - [ ] Mark Subscription as expired
  - [ ] Prevent join after expiration

- [ ] **Auto-Renewal**
  - [ ] Implement auto-renewal flow:
    - Check if auto-renewal enabled
    - Calculate same number of days
    - Charge same amount (or continuation pricing if applicable)
    - Generate new access code on success
    - Notify student (in-app + email)
  - [ ] Handle failed auto-renewal:
    - Set status to expired
    - Notify student
    - 3-day retry window
    - Allow join during grace period with reminders

- [ ] **Mid-Session Expiration**
  - [ ] Video token expires at subscription end date
  - [ ] Allow student to finish current session
  - [ ] Block future sessions

- [ ] **Student Dashboard Updates**
  - [ ] Display active subscriptions
  - [ ] Show time remaining
  - [ ] Show expiry date with countdown
  - [ ] Prominent renewal button
  - [ ] Show expired classes
  - [ ] Manage trusted devices section

- [ ] **Join Session Frontend**
  - [ ] Create JoinSession component
  - [ ] Display session info (time, host, topic)
  - [ ] "Join" button triggers validation
  - [ ] Show error if access denied
  - [ ] Show external meeting link or video room placeholder

**Deliverable:** Students validated on join. Expiration enforced. Auto-renewal works.

---

### Week 6: Analytics, Admin, & Polish
**Goal:** Basic analytics, admin dashboard, refinement, testing

#### Tasks:
- [ ] **Host Analytics API**
  - [ ] GET /api/analytics/host/overview
    - Total revenue, students, sessions
    - Revenue trend chart (last 30 days)
    - Student growth chart
    - Top classes by revenue

  - [ ] GET /api/analytics/host/class/:classId
    - Revenue by class
    - Student count trend
    - Session attendance
    - Free vs paid students

  - [ ] GET /api/analytics/host/payments
    - Transaction list with commission breakdown
    - Filter by date range
    - Export to CSV

- [ ] **Platform Analytics API (Admin)**
  - [ ] GET /api/analytics/platform/overview
    - Total users, hosts, students, classes
    - Total revenue
    - Transactions today/month/all-time
    - Revenue by payment processor
    - Commission breakdown

  - [ ] GET /api/analytics/platform/by-date
    - Revenue trends by day/week/month
    - Transaction count trends
    - Churn/retention analysis

- [ ] **Admin Dashboard Foundation**
  - [ ] Create AdminDashboard component
  - [ ] Build overview page with KPIs
  - [ ] Build users page (search, filter, suspend, delete)
  - [ ] Build transactions page (list, details, filter)
  - [ ] Build support tickets page (basic)
  - [ ] Auth check: only admins can access

- [ ] **Support System (Basic)**
  - [ ] Create Ticket schema (subject, description, status, priority)
  - [ ] POST /api/support/tickets - Create ticket
  - [ ] GET /api/support/tickets - List tickets (admin)
  - [ ] PATCH /api/support/tickets/:id - Update ticket
  - [ ] Support form on frontend

- [ ] **Email Notifications (Template)**
  - [ ] Create email templates:
    - Account welcome
    - Payment confirmation + access code
    - Class created confirmation
    - Access expiring soon
    - Auto-renewal successful/failed
  - [ ] Set up email service config (SendGrid or Nodemailer)
  - [ ] Test email sending

- [ ] **Comprehensive Testing**
  - [ ] Auth flow: register → login → create class
  - [ ] Payment flow: browse → select days → pay → get access code
  - [ ] Session join: validate access code → verify device → join
  - [ ] Expiration: access expires → renewal → new access code
  - [ ] Edge cases:
    - Chunk buying (3 days + 5 days + 22 days = $100 total)
    - Fixed-duration class with remaining days cap
    - Auto-renewal retry logic
    - Device fingerprint on 4th device

- [ ] **Frontend Polish**
  - [ ] Responsive design (mobile, tablet, desktop)
  - [ ] Error messages clear and actionable
  - [ ] Loading states on all async operations
  - [ ] Success notifications
  - [ ] Form validation (client-side)

- [ ] **Backend Polish**
  - [ ] Input validation & sanitization
  - [ ] Error handling (400, 401, 403, 404, 500)
  - [ ] Rate limiting on sensitive endpoints
  - [ ] Request logging
  - [ ] Database indexes on hot queries

- [ ] **Deployment Prep**
  - [ ] Database migration scripts
  - [ ] Environment configuration (.env.example)
  - [ ] Deployment docs
  - [ ] Security checklist

**Deliverable:** Full MVP working. Analytics visible. Admin dashboard functional. Testing complete.

---

## Detailed Task Tracking

Use this section to track daily progress:

### Week 1 Progress
- **Day 1:** ___________
- **Day 2:** ___________
- **Day 3:** ___________
- **Day 4:** ___________
- **Day 5:** ___________

### Week 2 Progress
- **Day 1:** ___________
- **Day 2:** ___________
- **Day 3:** ___________
- **Day 4:** ___________
- **Day 5:** ___________

### Week 3 Progress
- **Day 1:** ___________
- **Day 2:** ___________
- **Day 3:** ___________
- **Day 4:** ___________
- **Day 5:** ___________

### Week 4 Progress
- **Day 1:** ___________
- **Day 2:** ___________
- **Day 3:** ___________
- **Day 4:** ___________
- **Day 5:** ___________

### Week 5 Progress
- **Day 1:** ___________
- **Day 2:** ___________
- **Day 3:** ___________
- **Day 4:** ___________
- **Day 5:** ___________

### Week 6 Progress
- **Day 1:** ___________
- **Day 2:** ___________
- **Day 3:** ___________
- **Day 4:** ___________
- **Day 5:** ___________

---

## Critical Success Factors

✅ **Pricing Accuracy** - Chunk buying must calculate correctly  
✅ **Access Code Security** - Non-transferable, device-locked  
✅ **Payment Processing** - Both Stripe and Paystack working  
✅ **Expiration Enforcement** - Students locked out on expiry  
✅ **Auto-Renewal** - Seamless continuation with retry logic  
✅ **Performance** - <2s page load, <200ms API response  
✅ **Error Handling** - Clear messages, no crashes  
✅ **Testing** - All flows tested end-to-end  

---

## Blockers & Risks

| Risk | Mitigation |
|------|-----------|
| Payment processor integration delay | Start with Stripe, add Paystack later |
| Device fingerprinting accuracy | Use well-tested library (fpjs) |
| Pricing calculation complexity | Unit test all pricing edge cases |
| Database performance at scale | Add indexes early, test with >10k records |
| Auth token expiration management | Use refresh token flow, auto-refresh |

---

## Success Criteria

**MVP Launch is successful when:**

1. ✅ 100+ users can register and create accounts
2. ✅ 50+ hosts can create classes
3. ✅ 1,000+ students can browse and enroll
4. ✅ Payment processing: 98%+ success rate
5. ✅ Access codes: 0 unauthorized access incidents
6. ✅ Uptime: 99.9% over first week
7. ✅ Session join: <3 second entry time
8. ✅ Zero revenue loss to data corruption
9. ✅ Admin dashboards functional
10. ✅ Support team can resolve issues

---

## Dependencies

```
Week 1 → Week 2 → Week 3 → Week 4 → Week 5 → Week 6
Auth    Class   Pricing  Payment  Access   Analytics
        Model   Engine   Procs    Control  & Polish
```

Week 1 must complete before Week 2 starts (auth needed for class ownership).  
Week 2 must complete before Week 3 starts (classes needed for pricing).  
Week 3 and 4 can run in parallel (pricing and payment system).  
Week 4 must complete before Week 5 starts (access codes generated at payment).  
Week 6 is refinement and can run in parallel with Week 5.

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] All env vars configured
- [ ] Stripe live keys configured
- [ ] Paystack live keys configured
- [ ] Email service configured
- [ ] CORS configured for production domain
- [ ] Logging configured
- [ ] Error tracking configured (Sentry)
- [ ] Rate limiting configured
- [ ] Database backups configured
- [ ] CDN configured for static assets
- [ ] Health check endpoints working
- [ ] Monitoring/alerting configured

---

## Post-Launch (Phase 1.5)

- [ ] Monitor error logs and fix critical bugs
- [ ] Gather user feedback
- [ ] Optimize performance based on real usage
- [ ] Fix security issues if found
- [ ] Prepare for Phase 2 (host ranking, recording, etc.)

---

**Status:** Planning Complete  
**Next Step:** Begin Week 1 - Authentication & User Profiles  
**Est. Completion:** 6 weeks from start date  

