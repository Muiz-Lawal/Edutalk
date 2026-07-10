# 🗓️ PHASE 1 & PHASE 2 DETAILED IMPLEMENTATION SCHEDULE

**Project:** EduTalk MVP Launch  
**Date:** July 10, 2026  
**Goal:** Launch MVP in 5-6 weeks, then stabilize for 3-6 months  
**Status:** Ready to Execute

---

## 📅 TIMELINE OVERVIEW

```
Week 1-2:   Phase 1 Core Features (Paystack, Plans, Access Codes)
Week 3:     Phase 1 Features (2FA, Referral, Audit)
Week 4:     Testing, Fixes, Security Audit
Week 5-6:   Launch Prep, Beta Testing, Final QA

LAUNCH: End of Week 6

Post-Launch:
Week 7-16:  Phase 2 Development (3-4 months)
  - Session recording + watermarking
  - Host abandonment protection
  - Ban evasion system (5-6 layers)
  - AI features
  - Host ranking
  - Waitlist system
  - Enhanced analytics

END: Production ready platform
```

---

## 🚀 PHASE 1 WEEK-BY-WEEK BREAKDOWN

### WEEK 1: Foundation

#### Monday-Tuesday: Infrastructure Setup
**Tasks:**
1. Database backup & verification
2. Paystack account setup
   - Create account
   - Get API keys
   - Test mode setup
3. Environment configuration
   - Add Paystack keys to .env
   - Configure payment routes
4. Twilio setup (for 2FA SMS)
   - Create account
   - Get API keys
   - Phone number provisioning

**Deliverables:**
- [ ] Paystack credentials configured
- [ ] Twilio credentials configured
- [ ] Environment variables updated

**Owner:** DevOps/Backend Lead

---

#### Wednesday-Thursday: Paystack Integration

**Backend Tasks:**
1. Create `paystackService.js`
   - Payment initialization
   - Transaction verification
   - Webhook verification
2. Update `paymentController.js`
   - Add Paystack payment routes
   - Multi-gateway routing logic
   - Error handling
3. Create webhook routes
   - Payment success
   - Payment failure
   - Transaction logs

**Frontend Tasks:**
1. Update `EnrollmentPage.jsx`
   - Payment method selection
   - Paystack inline embed
   - Payment status handling

**Testing:**
- Unit tests for Paystack service
- Integration tests for payment flow
- Manual testing with test credentials

**Deliverables:**
- [ ] Paystack payment flow works
- [ ] Webhooks verified
- [ ] Tests passing
- [ ] Documentation updated

**Owner:** Backend Dev 1, Frontend Dev 1

---

#### Friday: Access Codes Enhancement

**Backend Tasks:**
1. Update `Subscription.js` model
   - Add `accessCodeExpiry` field
   - Add `accessCodeUsageCount` field
   - Add `accessCodeMaxUses` field (default: 1)

2. Create `accessCodeValidation.js` middleware
   - Layer 1: Email validation
   - Layer 2: Time expiry validation
   - Layer 3: Usage count validation

3. Update `subscriptionController.js`
   - Add triple-layer validation
   - Reject invalid codes
   - Log validation attempts

**Testing:**
- Layer 1 validation tests
- Layer 2 expiry tests
- Layer 3 usage count tests

**Deliverables:**
- [ ] Triple-layer validation implemented
- [ ] Tests passing
- [ ] Code reviewed

**Owner:** Backend Dev 2

---

### WEEK 2: Critical Features

#### Monday-Wednesday: Host Plan Tiers

**Backend Tasks:**
1. Create `HostPlan.js` model
   - Tier: Starter, Growth
   - Commission: 25%, 15%
   - Max classes: 5, unlimited
   - Max students: 50, unlimited
   - Features: basic, advanced

2. Create `planLimitsMiddleware.js`
   - Check class limit before creation
   - Check student limit before enrollment
   - Return error if limit exceeded

3. Create `hostPlanController.js`
   - Get current plan
   - Upgrade plan
   - View plan benefits
   - Cancel plan

4. Update `classController.js`
   - Check plan limits before creating
   - Enforce class limit
   - Enforce student limit

5. Update `subscriptionController.js`
   - Check plan limits before enrollment
   - Prevent over-enrollment

**Frontend Tasks:**
1. Create `HostPlansPage.jsx`
   - Display plan options
   - Show features
   - Show pricing

2. Create `PlanUpgradeModal.jsx`
   - Plan selection
   - Payment processing
   - Confirmation

3. Update `HostDashboardPage.jsx`
   - Display current plan
   - Show upgrade button
   - Show usage (classes/students)

**Database Migration:**
1. Add `hostPlanTier` field to User if not exists
2. Create HostPlan collection
3. Add plan limits validation

**Testing:**
- Starter plan enforcement
- Growth plan enforcement
- Upgrade flow
- Limit enforcement

**Deliverables:**
- [ ] Plan model created
- [ ] Limits enforced in API
- [ ] UI components created
- [ ] Tests passing
- [ ] Database migrated

**Owner:** Backend Dev 1, Frontend Dev 2

---

#### Thursday-Friday: 2FA System (Start)

**Backend Tasks:**
1. Create `TwoFASecret.js` model
   - userId
   - enabled: boolean
   - method: 'email' | 'sms'
   - secret (for TOTP if needed)
   - bacupCodes (for recovery)

2. Create `otpService.js`
   - OTP generation (6-digit)
   - OTP storage (Redis, 10 min expiry)
   - OTP verification
   - SMS sending (Twilio)
   - Email sending

3. Create `2faController.js`
   - Enable 2FA
   - Disable 2FA
   - Verify OTP
   - Generate backup codes
   - Send OTP

4. Create `2faMiddleware.js`
   - Check if 2FA required
   - Verify OTP before access
   - Session management post-2FA

**Frontend Tasks:**
1. Create `TwoFASetupPage.jsx`
   - Method selection
   - OTP verification
   - Backup codes display

2. Create `OTPVerificationModal.jsx`
   - OTP input
   - Verification logic
   - Resend OTP

3. Update `AdminLoginPage.jsx`
   - Trigger 2FA if enabled
   - Show OTP input

**Testing:**
- OTP generation
- OTP delivery (email/SMS)
- OTP verification
- 2FA enable/disable

**Deliverables:**
- [ ] OTP service created
- [ ] 2FA model created
- [ ] Setup UI created
- [ ] Tests started (will complete in Week 3)

**Owner:** Backend Dev 2, Frontend Dev 1

---

### WEEK 3: Remaining Features + Testing

#### Monday-Wednesday: 2FA Completion + Referral System

**2FA Completion:**
1. Complete 2FA integration with admin login
2. Add 2FA to sensitive actions
3. Comprehensive testing
4. Documentation

**Referral System:**
1. Create `Referral.js` model
   - referrerId
   - refereeId
   - referralCode
   - status: 'pending' | 'completed'
   - rewardAwarded: boolean

2. Create `referralController.js`
   - Generate referral code
   - Track referral
   - Award reward on payment
   - Get referral history
   - Get referral stats

3. Create `referralService.js`
   - Reward calculation
   - Reward payout logic
   - Referral validation

4. Create `referralRoutes.js`
   - GET /api/referrals/my-code
   - GET /api/referrals/history
   - POST /api/referrals/track
   - GET /api/referrals/stats

5. Update `paymentController.js`
   - Check for referral code
   - Award referral reward
   - Track reward payout

**Frontend Tasks:**
1. Create `ReferralPage.jsx`
   - Display referral code
   - Copy to clipboard
   - Show referral history
   - Show earnings

2. Create `ReferralCard.jsx`
   - Social sharing buttons
   - Code display
   - Stats display

3. Update signup flow
   - Accept referral code parameter
   - Track referrer

4. Update enrollment flow
   - Track referral on payment

**Testing:**
- Referral code generation
- Referral tracking
- Reward calculation
- Referral history display

**Deliverables:**
- [ ] 2FA fully working
- [ ] Referral system working
- [ ] All tests passing
- [ ] Code reviewed

**Owner:** Backend Dev 1 & 2, Frontend Dev 1 & 2

---

#### Thursday: Audit Logging Enhancement

**Backend Tasks:**
1. Create consolidated `AuditLog.js` model
   - userId
   - action: 'create', 'update', 'delete', 'login', etc.
   - resource: 'User', 'Class', 'Payment', etc.
   - resourceId
   - changes: before/after
   - ipAddress
   - userAgent
   - timestamp

2. Create `auditService.js`
   - Log action wrapper
   - Query audit logs
   - Export audit logs

3. Update `auditMiddleware.js`
   - Intercept all sensitive actions
   - Log to AuditLog model
   - Consolidate from Event/AdminLog/Payment

4. Create audit routes
   - GET /api/admin/audit-logs
   - POST /api/admin/audit-logs/export
   - Query filters (date, user, action)

**Frontend Tasks:**
1. Update `AdminLogs.jsx`
   - Display consolidated audit log
   - Filter by date, user, action
   - Export functionality

**Testing:**
- Audit log creation
- Audit log queries
- Export functionality

**Deliverables:**
- [ ] Consolidated audit logging
- [ ] Queries working
- [ ] UI updated
- [ ] Tests passing

**Owner:** Backend Dev 2, Frontend Dev 2

---

#### Friday: Integration Testing

**Test Suite:**
1. End-to-end user flow
   - Signup → Login → Browse → Enroll → Pay (Stripe + Paystack) → Access class
2. Host flow
   - Signup as host → Create class → Set tier → View analytics
3. Admin flow
   - Admin login with 2FA → Manage users → View audit logs
4. Referral flow
   - Referral code generation → Share → Friend signup → Payment → Reward awarded
5. Access code flow
   - Generate code → Validate email → Check time → Check usage → Allow/deny access

**Load Testing:**
- 100 concurrent users
- Payment processing load
- Database queries

**Security Testing:**
- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting

**Deliverables:**
- [ ] All integration tests passing
- [ ] Load test results documented
- [ ] Security scan passed
- [ ] Bug list compiled

**Owner:** QA Lead

---

### WEEK 4: Launch Preparation

#### Monday-Tuesday: Bug Fixes & Optimization

**Tasks:**
1. Fix bugs from Week 3 testing
2. Performance optimization
   - Database indexes
   - Query optimization
   - Caching setup (if needed)
3. Error handling improvements
4. API response validation

**Deliverables:**
- [ ] All bugs fixed
- [ ] Performance metrics recorded
- [ ] Code optimized

**Owner:** Backend Team

---

#### Wednesday: Security Audit

**Tasks:**
1. Third-party security scan (if possible)
2. Code review for security
3. API authentication/authorization check
4. Database security check
5. Deployment security check
6. Secrets management check (.env setup)

**Deliverables:**
- [ ] Security audit passed
- [ ] No critical issues
- [ ] All secrets removed from code

**Owner:** Security Lead + Backend Lead

---

#### Thursday: Documentation & Beta Setup

**Tasks:**
1. API documentation
   - Paystack payment flow
   - 2FA flow
   - Referral flow
   - Access codes

2. User documentation
   - Signup instructions
   - First class setup (for hosts)
   - Enrollment instructions

3. Admin documentation
   - Admin dashboard guide
   - User management
   - Payment management
   - 2FA setup

4. Beta tester recruitment
   - Identify 20-50 beta users
   - Create test accounts
   - Provide feedback forms

**Deliverables:**
- [ ] Documentation complete
- [ ] Beta testers recruited
- [ ] Test accounts created

**Owner:** Product + Marketing

---

#### Friday: Final QA & Go/No-Go Decision

**Tasks:**
1. Final end-to-end testing
2. Deployment checklist
3. Go/no-go decision
4. Production deployment planning

**Deliverables:**
- [ ] Final QA passed
- [ ] Go-live decision made
- [ ] Deployment scheduled

**Owner:** QA Lead + Product Lead

---

### WEEK 5-6: Launch Week

#### Week 5: Beta Testing
1. Deploy to beta environment
2. Beta testers onboard
3. Collect feedback
4. Fix critical bugs
5. Prepare marketing materials

#### Week 6: Production Launch
1. Production deployment
2. Monitor system
3. Support team ready
4. Marketing campaign launch
5. Celebrate! 🎉

---

## 📅 PHASE 2 TIMELINE (After Launch + 1-2 weeks stabilization)

### PHASE 2: Growth & Stability (Months 2-6)

#### Month 1 of Phase 2 (Weeks 1-4): Core Features
1. **Session Recording + Watermarking** (1 week)
2. **Host Abandonment Protection** (1 week)
3. **Ban Evasion System (5 layers)** (2 weeks)
4. Testing & Integration (1 week)

#### Month 2 of Phase 2 (Weeks 5-8): AI + Ranking
1. **AI Features** (chat mod, summaries, quizzes) (2 weeks)
2. **Host Ranking System** (1 week)
3. **Waitlist System** (1 week)
4. Testing & Integration (1 week)

#### Month 3 of Phase 2 (Weeks 9-12): Analytics + Polish
1. **Enhanced Analytics** (1 week)
2. **Admin Improvements** (1 week)
3. **Performance Optimization** (1 week)
4. Testing & Polish (1 week)

#### Months 4-6 of Phase 2: Monitoring & Iteration
1. Monitor metrics
2. Fix issues from real users
3. Iterate based on feedback
4. Plan Phase 3

---

## 🎯 SUCCESS METRICS

### Phase 1 Launch
- [ ] 0 critical bugs
- [ ] 99.9% uptime
- [ ] <2% payment failure rate
- [ ] <4 hour support response time
- [ ] All documentation complete

### Phase 1 Post-Launch (Month 1)
- [ ] 100+ users signup
- [ ] 10+ hosts create classes
- [ ] $5,000+ in transactions
- [ ] <1% churn
- [ ] 4.5+ star rating

### Phase 2 Post-Launch (Month 6)
- [ ] 10,000+ active users
- [ ] 500+ active hosts
- [ ] $500K+ monthly revenue
- [ ] 50%+ retention
- [ ] 4.8+ star rating

---

## 📊 RESOURCE ALLOCATION

**Team Size:** 4-5 people recommended

1. **Backend Lead** (Dev 1)
   - Paystack integration
   - Host plan tiers
   - Architecture

2. **Backend Dev** (Dev 2)
   - 2FA system
   - Referral system
   - Audit logging

3. **Frontend Lead** (Dev 3)
   - Enrollment updates
   - Plan tiers UI
   - All new pages

4. **Frontend Dev** (Dev 4)
   - 2FA UI
   - Referral UI
   - Audit UI

5. **QA/DevOps** (Lead)
   - Testing
   - Deployment
   - Monitoring

---

## 🚀 IMMEDIATE NEXT STEPS

**This Week (Action Items):**

1. **Today:**
   - [ ] Review this document with team
   - [ ] Assign owners to each task
   - [ ] Setup Paystack account
   - [ ] Setup Twilio account

2. **Tomorrow:**
   - [ ] Start Paystack integration (Backend Dev 1)
   - [ ] Verify existing features (Backend Dev 2)
   - [ ] Setup environment (DevOps)

3. **This Week:**
   - [ ] Complete Paystack integration
   - [ ] Start Access Codes enhancement
   - [ ] Start Host Plan Tiers

4. **Next Week:**
   - [ ] Paystack ready for testing
   - [ ] All Phase 1 features in progress

---

**Status:** ✅ READY FOR EXECUTION  
**Version:** 1.0  
**Last Updated:** July 10, 2026  
**Next Review:** End of Week 1
