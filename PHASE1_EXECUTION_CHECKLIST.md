# ✅ PHASE 1 EXECUTION CHECKLIST

**Purpose:** Daily checklist to track Phase 1 MVP implementation  
**Status:** Ready to use  
**Date Started:** [TBD]

---

## 🎯 WEEK 1: INFRASTRUCTURE & PAYSTACK

### Monday-Tuesday: Infrastructure Setup

#### Paystack Account Setup
- [ ] Signup for Paystack account
  - Website: https://paystack.com
  - Get test API keys
  - Get live API keys (for later)
- [ ] Configure Paystack dashboard
  - [ ] Setup webhook URL
  - [ ] Enable 3D Secure
  - [ ] Configure success/failure URLs
- [ ] Add to `.env` file
  ```
  PAYSTACK_SECRET_KEY=sk_test_xxx
  PAYSTACK_PUBLIC_KEY=pk_test_xxx
  ```
- [ ] Test API connectivity
  - [ ] Can list customers
  - [ ] Can initialize transaction
  - [ ] Webhooks working

#### Twilio Setup (for 2FA)
- [ ] Signup for Twilio account
  - Website: https://www.twilio.com
  - Get account SID
  - Get auth token
  - Get Twilio phone number
- [ ] Add to `.env` file
  ```
  TWILIO_ACCOUNT_SID=AC_xxx
  TWILIO_AUTH_TOKEN=xxx
  TWILIO_PHONE_NUMBER=+1xxx
  ```
- [ ] Test SMS sending
  - [ ] Can send test SMS
  - [ ] SMS delivery working

#### Database Backup
- [ ] Backup MongoDB
  ```bash
  mongodump --uri="mongodb://..." --out=/backups/phase1-start
  ```
- [ ] Verify backup integrity
  - [ ] Can restore from backup
  - [ ] All data present

#### Environment Configuration
- [ ] Update backend `.env`:
  - [ ] PAYSTACK_SECRET_KEY
  - [ ] PAYSTACK_PUBLIC_KEY
  - [ ] TWILIO_ACCOUNT_SID
  - [ ] TWILIO_AUTH_TOKEN
  - [ ] TWILIO_PHONE_NUMBER
- [ ] Update frontend `.env`:
  - [ ] VITE_PAYSTACK_PUBLIC_KEY
- [ ] Verify no hardcoded keys in code
  ```bash
  grep -r "sk_test_" backend/src/
  grep -r "pk_test_" frontend/src/
  ```
- [ ] Deploy .env files to dev environment

**Status:** [ ] Complete

---

### Wednesday-Thursday: Paystack Integration

#### Backend Implementation

##### File: `backend/src/services/paystackService.js` (NEW)
- [ ] Create service file
- [ ] Implement functions:
  - [ ] `initializePayment(email, amount, metadata)`
  - [ ] `verifyPayment(reference)`
  - [ ] `getPaymentStatus(reference)`
  - [ ] `getCustomerPayments(customerId)`
  - [ ] `refundPayment(reference, amount)`
- [ ] Add error handling
- [ ] Add logging

##### File: `backend/src/routes/paystackRoutes.js` (NEW)
- [ ] Create routes file
- [ ] Implement routes:
  - [ ] `POST /api/payments/paystack/initialize`
  - [ ] `POST /api/payments/paystack/verify`
  - [ ] `GET /api/payments/paystack/status/:reference`
- [ ] Add middleware:
  - [ ] Authentication check
  - [ ] Input validation

##### File: `backend/src/routes/paystackWebhookRoutes.js` (NEW)
- [ ] Create webhook routes
- [ ] Implement webhook:
  - [ ] `POST /webhooks/paystack/payment`
  - [ ] Signature verification
  - [ ] Payment confirmation logic
  - [ ] Update user balance
  - [ ] Enrollment confirmation
  - [ ] Send confirmation email
- [ ] Add logging for all webhooks
- [ ] Add retry logic

##### File: `backend/src/config/paystack.config.js` (NEW)
- [ ] Create config file
- [ ] Export Paystack instance
- [ ] Initialize with credentials
- [ ] Setup request/response interceptors

##### File: `backend/src/controllers/paymentController.js` (UPDATE)
- [ ] Add new functions:
  - [ ] `initializePaystackPayment()`
  - [ ] `verifyPaystackPayment()`
  - [ ] `paystackWebhook()`
- [ ] Update routing logic to handle both Stripe and Paystack
- [ ] Update error messages

##### File: `backend/server.js` (UPDATE)
- [ ] Import Paystack routes
- [ ] Register routes:
  ```javascript
  app.use('/api/payments', paystackRoutes);
  app.use('/webhooks', paystackWebhookRoutes);
  ```
- [ ] Verify no conflicts with existing routes

#### Frontend Implementation

##### File: `frontend/src/pages/EnrollmentPage.jsx` (UPDATE)
- [ ] Add payment method selector
  - [ ] Radio buttons: Stripe / Paystack
- [ ] Add Paystack payment flow:
  - [ ] Show when Paystack selected
  - [ ] Initialize payment
  - [ ] Show loading state
  - [ ] Handle success response
  - [ ] Handle error response
  - [ ] Generate access code
  - [ ] Show confirmation

##### File: `frontend/src/components/PaymentMethodSelector.jsx` (NEW - Optional)
- [ ] Create reusable component
- [ ] Stripe option
- [ ] Paystack option
- [ ] Selected state

#### Testing

##### Unit Tests: `backend/tests/paystack.test.js`
- [ ] Test payment initialization
  - [ ] Valid amount
  - [ ] Invalid amount (zero, negative)
  - [ ] Valid email
  - [ ] Invalid email
- [ ] Test payment verification
  - [ ] Valid reference
  - [ ] Invalid reference
  - [ ] Payment confirmed
  - [ ] Payment pending
- [ ] Test webhook verification
  - [ ] Valid signature
  - [ ] Invalid signature
  - [ ] Duplicate webhook
- [ ] Test refund
  - [ ] Valid refund
  - [ ] Invalid reference

##### Integration Tests: `backend/tests/paystack-integration.test.js`
- [ ] Test full payment flow
  - [ ] Initialize → Verify → Confirm
  - [ ] Enrollment created
  - [ ] Access code generated
- [ ] Test webhook flow
  - [ ] Webhook received
  - [ ] Payment confirmed
  - [ ] Email sent
- [ ] Test error scenarios
  - [ ] Network error
  - [ ] Invalid credentials
  - [ ] Rate limiting

##### Manual Testing
- [ ] Use Paystack test cards
  - [ ] Successful payment: 4084084084084081
  - [ ] Failed payment: 4000000000000002
- [ ] Test full enrollment flow with Paystack
  - [ ] Select Paystack
  - [ ] Enter card details
  - [ ] Confirm payment
  - [ ] Receive confirmation
  - [ ] Can access class
- [ ] Test webhook
  - [ ] Use Paystack dashboard webhook tester
  - [ ] Verify payment confirmed
  - [ ] Verify email sent
- [ ] Test error handling
  - [ ] Invalid card
  - [ ] Network timeout
  - [ ] Missing credentials

**Deliverables:**
- [ ] Paystack service implemented
- [ ] Routes implemented
- [ ] Webhooks working
- [ ] Tests passing
- [ ] Manual testing complete
- [ ] Code reviewed

**Status:** [ ] Complete

---

### Friday: Access Codes Enhancement

#### Backend Implementation

##### File: `backend/src/models/Subscription.js` (UPDATE)
```javascript
// Add fields:
accessCodeExpiry: { type: Date, required: true },       // When code expires
accessCodeUsageCount: { type: Number, default: 0 },     // How many times used
accessCodeMaxUses: { type: Number, default: 1 },        // Max times usable
accessCodeValidationLog: [{                              // Audit trail
  attempt: String,    // 'email_valid', 'time_valid', 'usage_valid'
  status: String,     // 'pass', 'fail'
  timestamp: Date
}]
```

Tasks:
- [ ] Update Subscription model
- [ ] Add migration script (if needed)
- [ ] Verify existing records still work

##### File: `backend/src/middleware/accessCodeValidation.js` (NEW)
```javascript
// Implement triple-layer validation:
// Layer 1: Email validation
// Layer 2: Time expiry validation  
// Layer 3: Usage count validation
```

Tasks:
- [ ] Create middleware file
- [ ] Implement Layer 1: Email check
  - [ ] Get code from request
  - [ ] Check email matches enrollment
  - [ ] Log attempt
- [ ] Implement Layer 2: Time check
  - [ ] Check current time < accessCodeExpiry
  - [ ] Return 'code expired' if exceeded
  - [ ] Log attempt
- [ ] Implement Layer 3: Usage check
  - [ ] Check accessCodeUsageCount < accessCodeMaxUses
  - [ ] Increment usage count on success
  - [ ] Return 'code already used' if exceeded
  - [ ] Log attempt

##### File: `backend/src/controllers/subscriptionController.js` (UPDATE)
- [ ] Update access code generation:
  - [ ] Set expiry to current_time + 30 days
  - [ ] Set maxUses to 1 (one-time use)
  - [ ] Initialize usageCount to 0
- [ ] Update access code validation:
  - [ ] Call triple-layer middleware
  - [ ] Return 403 if any layer fails
  - [ ] Return 200 if all layers pass
  - [ ] Log validation result
- [ ] Add new endpoint: `POST /api/subscriptions/:id/validate-access-code`

##### File: `backend/src/routes/subscriptionRoutes.js` (UPDATE)
- [ ] Add route for access code validation
  ```javascript
  router.post('/:id/validate-access-code', 
    authenticateToken, 
    accessCodeValidation,
    validateAccessCode);
  ```

#### Testing

##### Unit Tests: `backend/tests/accessCode.test.js`
- [ ] Test Layer 1 (Email validation)
  - [ ] Correct email
  - [ ] Wrong email
  - [ ] Empty email
- [ ] Test Layer 2 (Time validation)
  - [ ] Code not expired
  - [ ] Code expired
  - [ ] Code expires tomorrow
- [ ] Test Layer 3 (Usage validation)
  - [ ] First use (0 -> 1)
  - [ ] Second use attempt (already 1)
  - [ ] Usage count increments
- [ ] Test validation log
  - [ ] All attempts logged
  - [ ] Log includes timestamp

##### Integration Tests: `backend/tests/accessCode-integration.test.js`
- [ ] Test full validation flow
  - [ ] Generate code
  - [ ] Validate successfully
  - [ ] Try to use again -> rejected
- [ ] Test expiry flow
  - [ ] Generate code
  - [ ] Set expiry to past
  - [ ] Validate -> rejected

##### Manual Testing
- [ ] Enroll in class
- [ ] Get access code
- [ ] Try to access class
  - [ ] With correct email -> Success
  - [ ] With wrong email -> Fail
  - [ ] After 30 days -> Fail
  - [ ] Second use attempt -> Fail
- [ ] Check validation logs
  - [ ] All attempts recorded

**Deliverables:**
- [ ] Model updated
- [ ] Middleware created
- [ ] Controller updated
- [ ] Tests passing
- [ ] Manual testing complete
- [ ] Code reviewed

**Status:** [ ] Complete

---

## 📊 WEEK 2: HOST PLANS & 2FA START

### Monday-Wednesday: Host Plan Tiers

#### Database Setup

##### File: `backend/src/models/HostPlan.js` (NEW)
```javascript
{
  _id: ObjectId,
  name: 'Starter' | 'Growth',
  description: String,
  commissionRate: 0.25 | 0.15,        // 25% or 15%
  maxClasses: 5 | null,                // null = unlimited
  maxStudentsPerClass: 50 | null,
  features: [String],                  // ['analytics', 'priority-support']
  monthlyPrice: Number,                // 0 (free) or 29
  createdAt: Date,
  updatedAt: Date
}
```

Tasks:
- [ ] Create model file
- [ ] Add indexes on name
- [ ] Create seed data
  ```javascript
  db.hostplans.insertMany([
    {
      name: 'Starter',
      description: 'Perfect for getting started',
      commissionRate: 0.25,
      maxClasses: 5,
      maxStudentsPerClass: 50,
      features: ['basic-analytics', 'email-support'],
      monthlyPrice: 0
    },
    {
      name: 'Growth',
      description: 'For growing instructors',
      commissionRate: 0.15,
      maxClasses: null,
      maxStudentsPerClass: null,
      features: ['advanced-analytics', 'priority-support'],
      monthlyPrice: 29
    }
  ])
  ```

##### File: `backend/src/models/User.js` (UPDATE)
- [ ] Add/verify field: `hostPlanTier` (Starter, Growth, null)
- [ ] Add field: `hostPlanStartDate` (when plan started)
- [ ] Add migration if needed

#### Backend Implementation

##### File: `backend/src/middleware/planLimitsMiddleware.js` (NEW)
```javascript
// Implement checks:
// 1. Check class limit before creating class
// 2. Check student limit before enrolling
// 3. Return 403 if limit exceeded
```

Tasks:
- [ ] Get user's plan tier
- [ ] Get plan details from HostPlan model
- [ ] For class creation:
  - [ ] Count existing classes for user
  - [ ] Check count < maxClasses (if limited)
  - [ ] Return 403 with message if exceeded
- [ ] For enrollment:
  - [ ] Count enrolled students in class
  - [ ] Check count < maxStudentsPerClass (if limited)
  - [ ] Return 403 with message if exceeded

##### File: `backend/src/controllers/hostPlanController.js` (NEW)
- [ ] `getCurrentPlan(userId)`
  - [ ] Get user
  - [ ] Get plan details
  - [ ] Calculate usage (classes, students)
  - [ ] Return plan + usage
- [ ] `getPlanOptions()`
  - [ ] List all plans
  - [ ] Include pricing, features
- [ ] `upgradePlan(userId, newTier)`
  - [ ] Get new plan details
  - [ ] If paid: process payment via Stripe
  - [ ] Update user's hostPlanTier
  - [ ] Update hostPlanStartDate
  - [ ] Send confirmation email
  - [ ] Return updated plan
- [ ] `getPlanBenefits(tier)`
  - [ ] Return features, limits

##### File: `backend/src/routes/hostPlanRoutes.js` (NEW)
```javascript
router.get('/plans/current', authenticateToken, isHost, getCurrentPlan);
router.get('/plans/options', authenticateToken, getPlanOptions);
router.post('/plans/upgrade', authenticateToken, isHost, upgradePlan);
router.get('/plans/:tier/benefits', getPlanBenefits);
```

##### File: `backend/src/controllers/classController.js` (UPDATE)
- [ ] In `createClass()`:
  - [ ] Call planLimitsMiddleware
  - [ ] Check class limit
  - [ ] Return 403 if exceeded with error message
  - [ ] Log limit violation

##### File: `backend/src/controllers/subscriptionController.js` (UPDATE)
- [ ] In `enrollInClass()`:
  - [ ] Call planLimitsMiddleware
  - [ ] Check student limit
  - [ ] Return 403 if exceeded
  - [ ] Log limit violation

##### File: `backend/src/routes/classRoutes.js` (UPDATE)
- [ ] Add middleware to create route:
  ```javascript
  router.post('/', authenticateToken, isHost, planLimitsMiddleware, createClass);
  ```

##### File: `backend/src/routes/subscriptionRoutes.js` (UPDATE)
- [ ] Add middleware to enroll route:
  ```javascript
  router.post('/:classId/enroll', authenticateToken, planLimitsMiddleware, enrollClass);
  ```

#### Frontend Implementation

##### File: `frontend/src/pages/HostPlansPage.jsx` (NEW)
- [ ] Display plan comparison table
  - [ ] Plan name
  - [ ] Features
  - [ ] Pricing
  - [ ] Upgrade button
- [ ] Show current plan (if host)
  - [ ] Current usage (X/5 classes, Y/50 students)
  - [ ] Upgrade button

##### File: `frontend/src/components/PlanCard.jsx` (NEW)
- [ ] Display single plan
  - [ ] Name, description
  - [ ] Price
  - [ ] Features list
  - [ ] Select/upgrade button

##### File: `frontend/src/components/PlanUpgradeModal.jsx` (NEW)
- [ ] Plan selection modal
  - [ ] Show current plan
  - [ ] Show target plan
  - [ ] Show pricing
  - [ ] Confirm button (if paid)
  - [ ] Stripe payment integration
  - [ ] Success/error handling

##### File: `frontend/src/pages/HostDashboardPage.jsx` (UPDATE)
- [ ] Add plan info section
  - [ ] Current plan name
  - [ ] Usage stats (classes, students)
  - [ ] Upgrade link
- [ ] Show plan limits info
  - [ ] Max classes
  - [ ] Max students per class

##### File: `frontend/src/components/ClassCreationForm.jsx` (UPDATE)
- [ ] Show limit warning if near limit
  - [ ] "You have 4/5 classes created"
  - [ ] "Upgrade to Growth for unlimited classes"
- [ ] Disable create button if at limit
  - [ ] Show error message
  - [ ] Link to upgrade

#### Database Migration

Tasks:
- [ ] Create migration script: `backend/scripts/migratePlans.js`
  - [ ] Create HostPlan collection
  - [ ] Seed starter and growth plans
  - [ ] Add default hostPlanTier='Starter' to existing hosts
- [ ] Run migration
  ```bash
  node backend/scripts/migratePlans.js
  ```
- [ ] Verify:
  - [ ] HostPlan collection created
  - [ ] 2 plans in database
  - [ ] All hosts have hostPlanTier set

#### Testing

##### Unit Tests: `backend/tests/hostPlan.test.js`
- [ ] Test plan limits
  - [ ] Can create < limit
  - [ ] Cannot create >= limit
  - [ ] Upgrade increases limit
- [ ] Test student limits
  - [ ] Can enroll < limit
  - [ ] Cannot enroll >= limit
- [ ] Test plan upgrade
  - [ ] Upgrade saves to database
  - [ ] Commision rate updated
  - [ ] Limits updated

##### Integration Tests: `backend/tests/hostPlan-integration.test.js`
- [ ] Test host with Starter plan
  - [ ] Can create 5 classes
  - [ ] Cannot create 6th class
  - [ ] Can enroll up to 50 students
  - [ ] Cannot enroll 51st student
- [ ] Test host with Growth plan
  - [ ] Can create unlimited classes
  - [ ] Can enroll unlimited students
- [ ] Test plan upgrade
  - [ ] Upgrade from Starter to Growth
  - [ ] Limits updated
  - [ ] Can now create 6th class

##### Manual Testing
- [ ] Signup as host with Starter plan
  - [ ] Create 5 classes (success)
  - [ ] Try create 6th (error)
- [ ] Enroll students
  - [ ] Enroll 50 students (success)
  - [ ] Try enroll 51st (error)
- [ ] Upgrade plan
  - [ ] Click upgrade
  - [ ] Choose Growth
  - [ ] Process payment
  - [ ] Verify upgraded
  - [ ] Create 6th class (success)
  - [ ] Enroll 51st student (success)

**Deliverables:**
- [ ] HostPlan model created
- [ ] Migration script run
- [ ] Middleware implemented
- [ ] Controller implemented
- [ ] Routes implemented
- [ ] Frontend components created
- [ ] UI updated with plan info
- [ ] Tests passing
- [ ] Manual testing complete

**Status:** [ ] Complete

---

### Thursday-Friday: 2FA System (Start)

[Detailed tasks for 2FA implementation - similar level of detail as above]

**Status:** [ ] Started, continue in Week 3

---

## 📊 WEEK 3: 2FA + REFERRAL + AUDIT

[Detailed tasks for 2FA completion, referral system, and audit logging]

---

## 🧪 WEEK 4: TESTING & LAUNCH PREP

[Detailed tasks for bug fixes, security audit, documentation, beta setup]

---

## 🎯 LAUNCH READINESS CHECKLIST

### Pre-Launch (Week 4, Friday)
- [ ] All Phase 1 features implemented
- [ ] All tests passing (unit, integration, e2e)
- [ ] 0 critical bugs
- [ ] 0 security vulnerabilities
- [ ] Documentation complete
- [ ] API docs complete
- [ ] User guides complete
- [ ] Admin guides complete
- [ ] Beta testers recruited
- [ ] Monitoring setup
- [ ] Logging setup
- [ ] Alerting setup
- [ ] Backup setup
- [ ] Disaster recovery plan
- [ ] Support team trained
- [ ] FAQ prepared
- [ ] Support email setup
- [ ] Support chat setup

### Launch Day (Week 6)
- [ ] Final backup taken
- [ ] Monitoring active
- [ ] Team on standby
- [ ] Database indices optimized
- [ ] Cache warming completed
- [ ] CDN primed
- [ ] Domain DNS verified
- [ ] SSL certificate valid
- [ ] Load balancer active
- [ ] Rollback plan ready
- [ ] Communication channels open
- [ ] Deployment initiated
- [ ] Health checks passing
- [ ] Traffic monitored
- [ ] Users signing up
- [ ] First payments processing
- [ ] No errors in logs
- [ ] Response times acceptable
- [ ] Database load acceptable

### Post-Launch (Week 6+)
- [ ] 24/7 monitoring active
- [ ] Support team responding
- [ ] Bugs being tracked
- [ ] Critical fixes deployed
- [ ] Users providing feedback
- [ ] Metrics collecting
- [ ] Performance acceptable
- [ ] Scaling not needed (yet)
- [ ] User retention good
- [ ] Revenue flowing
- [ ] Team celebrating 🎉

---

**Status:** Ready to Begin  
**Created:** July 10, 2026  
**Last Updated:** July 10, 2026
