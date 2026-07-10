# 📚 EduTalk Complete Platform Specification

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Official Platform Specification  

---

## Table of Contents

1. [What the Platform Is](#what-the-platform-is)
2. [Core Architecture](#core-architecture)
3. [How Hosts Create and Manage Classes](#how-hosts-create-and-manage-classes)
4. [How Students Find and Pay for Classes](#how-students-find-and-pay-for-classes)
5. [Payment Processing](#payment-processing)
6. [Access Control & Security](#access-control--security)
7. [Host Plan Tiers](#host-plan-tiers)
8. [Student Features](#student-features)
9. [Admin Roles & Features](#admin-roles--features)
10. [Session Recording & Archives](#session-recording--archives)
11. [Notifications System](#notifications-system)
12. [Analytics & Reporting](#analytics--reporting)
13. [Dispute Resolution & Appeals](#dispute-resolution--appeals)
14. [Multi-language & Localization](#multi-language--localization)
15. [Performance & Scalability](#performance--scalability)
16. [Future Expansion](#future-expansion)

---

## What the Platform Is

This platform is a live video conferencing and virtual classroom application built specifically for **paid education**. It works similarly to Zoom, Google Meet, or Microsoft Teams in terms of video calling capabilities, but differs fundamentally: **every class requires payment before a student can enter**. There are no free links, no open rooms, and no way to bypass payment. If a student hasn't paid, they cannot get in.

The platform connects **hosts** (who teach) and **students** (who pay to attend). Hosts can be professionals, musicians, tutors, instructors, or anyone with expertise. The platform provides scheduling, payments, video delivery, access control, notifications, security, and everything needed to run a paid live education business.

### Key Differentiator: Flexible Day-Based Pricing

Unlike rigid monthly subscriptions, students can **pay for any number of days they want**. A student can afford just 3 days, 5 days, or 10 days—whatever fits their budget. The platform is designed around this flexibility, with every system supporting this approach.

---

## Core Architecture

### Technology Stack
- **Frontend:** React 18 + Vite + React Router v6 + Axios
- **Backend:** Node.js + Express.js + MongoDB
- **Video:** WebRTC + HLS streaming
- **Payments:** Stripe (International) + Paystack (Africa)
- **Authentication:** JWT + bcryptjs
- **Real-time:** Socket.io

### User Roles (Multi-Role Support)
Users can simultaneously be:
- **Student** - Enrolls and pays for classes
- **Host** - Creates and teaches classes
- **Admin** - Manages platform (with 5 role tiers)

After login, users with multiple roles see a role switcher to choose which dashboard to enter.

---

## How Hosts Create and Manage Classes

### Class Creation Workflow

1. **Class Information**
   - Title and detailed description
   - Category (Technology, Music, Business, Design, Languages, Fitness, Science, Arts, Cooking, Photography)
   - Tags for search discovery
   - Thumbnail image

2. **Pricing Model**
   - Host sets a single **monthly price** in USD
   - Platform auto-calculates tiered daily rates:
     `
     1-3 days:    1.8x multiplier   (e.g., /month = .00/day)
     4-6 days:    1.5x multiplier   (/month = .00/day)
     7-13 days:   1.25x multiplier  (/month = .17/day)
     14-20 days:  1.1x multiplier   (/month = .67/day)
     21-30 days:  1.0x multiplier   (/month = .33/day)
     `
   - **Short Course Mode:** For classes under 7 days, set flat total price instead

3. **Minimum Purchase Days**
   - Host chooses minimum: 1, 2, 3, 5, or 7 days
   - Prevents students from buying days with no scheduled sessions

4. **Class Duration Type**
   - **Fixed Duration:** Specific start and end dates (e.g., "Python Bootcamp: Jan 1-30")
   - **Ongoing:** Runs indefinitely (e.g., "Weekly Guitar Lessons" every Saturday)
   - For started fixed-duration classes, cap max purchase at remaining days

5. **Schedule Definition**
   - Select days of the week (don't need to teach every day)
   - Set time for each day
   - Set session duration (1hr, 1.5hr, etc.)
   - Set timezone
   - Platform auto-generates session occurrences

6. **Session Management**
   - Add one-off bonus sessions
   - Cancel individual sessions (2+ hours notice)
   - **Vacation Mode:** Pause for up to 14 days, auto-extend all subscriptions

7. **Video Mode**
   - **Built-in Video:** Growth plan+ only
   - **External Link:** All hosts (Zoom, Google Meet, etc.)
   - **Recording:** Auto-record on Pro/Elite plans
     - Non-downloadable, HLS/DASH streams
     - Watermarked with student email
     - Signed URLs expire after 4 hours

8. **Preview Content**
   - Upload 2-5 minute intro video (public, no login required)
   - Mark one session/month as free preview session
   - AI can transcribe intro video and generate summary

9. **Capacity & Visibility**
   - Set maximum students (or unlimited)
   - Make publicly searchable or unlisted (direct link only)
   - Waitlist auto-activates at max capacity

---

## How Students Find and Pay for Classes

### Discovery

Students browse classes:
- By category with search
- Filter by price range, rating, schedule days, free preview availability
- View class title, host name and badge, host plan tier, schedule, starting daily rate, avg rating, enrolled count, status

### Class Details Page

Shows:
- Full description and what they'll learn
- Prerequisites
- Host profile, other classes
- Complete schedule (days/times)
- All sessions with dates (past/upcoming)
- Student reviews with 5-category breakdown
  - Teaching quality
  - Content relevance
  - Engagement
  - Value for money
  - Pace
- Host ranking tier (New Host, Rising Host, Pro Host, Elite Host)
- "Founding Host" badge (if applicable)
- **Enrollment card**

### Enrollment Card

Students:
- Use slider or quick-select buttons to choose days
- Real-time updates show:
  - Daily rate
  - Total price
  - Exact date range of access
  - List of included sessions
  - Savings vs highest daily rate
- Option for auto-renewal (auto-charge same days when period expires)
- For fixed-duration started classes: slider capped at remaining days

### Pre-Payment Options

Before paying, students can:
- Watch host intro video
- Join free preview session (if scheduled)
- Join first 10 minutes of any session free, then payment prompt
- Send up to 3 free messages to host

### Currency & Payments

- Display in student's local currency (auto-detected or manually selected)
- Supports 12+ currencies: USD, GBP, EUR, NGN, INR, CAD, JPY, BRL, ZAR, GHS, KES, AUD
- **International:** Stripe
- **Africa:** Paystack
- Students get payout in USD

### Referrals

- Unique referral link per student
- When referred student makes first purchase:
  - Both get 1 free day added
  - Max 5 rewards/month per user

---

## Payment Processing

### Payment Confirmation Flow

When payment confirmed via Stripe/Paystack:

1. **Subscription Created**
   - Links student to class for specific days purchased

2. **Access Code Generated**
   - Format: PC-XXXX-XXXX-XXXX
   - Uses 30 unambiguous characters (uppercase no O/I/L, digits 2-9)
   - ~531 billion combinations
   - Tied to:
     - Student email
     - Specific class
     - Exact date range
     - Device fingerprint (from browser at purchase)

3. **Device Fingerprint System**
   - Recorded at code generation
   - Max 3 trusted devices per access code
   - Attempting 4th device: verify via email or OTP
   - Prevents code sharing

4. **Confirmation Email**
   - Access code
   - Date range
   - Class schedule
   - Non-transferability warning
   - Email/device lock explanation
   - Link to manage trusted devices

5. **Commission Split**
   - Platform commission (10-25% depending on host plan)
   - Stripe/Paystack fee (~2.9% + .30)
   - Host receives remainder
   - Calculated per transaction
   - Per-transaction basis: hosts get paid immediately after commission/processor fees

### Payment Continuation (Chunk Buying)

Student who buys 3 days, then later buys 5 more days is **never financially penalized**.

**Payment Chain System:**
- Tracks all purchases for student-class combo
- When buying more days, calculate:
  - **Fresh price:** Standard tiered rate for new days
  - **Continuation price:** (total days combined price) - (already paid)
  - **Student pays:** Whichever is lower

**Example:**
- Day 1: Buy 3 days @ /month = .00
- Day 2: Buy 5 more days
  - Fresh: .00
  - Continuation: (8 days @ 7-13 tier = .33) - .00 = .33
  - Pays: .33
- Day 3: Buy remaining 22 days
  - Full class: 
  - Paid: .33
  - Owes: .67
  - **Total across 3 purchases: ** ✓ (same as 30-day upfront)

**Extending Access:**
- If current access active: end date pushed forward (no gap, no new code)
- If expired: payment history preserved for continuation pricing, new code generated

---

## Access Control & Security

### Join Session Validation

When student clicks "Join Session":

1. Verify student logged in
2. Verify active access code for this class
3. Verify code matches student email
4. Verify current date in valid range
5. Verify device fingerprint matches one of 3 trusted devices
6. Verify session is live or in 15-min early-join window
7. If all pass: enter video room

If any fails: specific error message + option to renew/purchase more days

### Four-Level Security

1. **Daily automated process** marks expired codes and subscriptions
2. **Live join validation** checks date/time in real-time
3. **Video token expiry** set to earlier of: subscription end date or session end time
4. **Device fingerprint check** matches device against registered devices

### Trusted Device Management

- Max 3 devices per access code
- 4th device: email verification or OTP required before adding
- Prevents unauthorized code sharing

### Expiration Handling

- **On expiration:** Completely locked out
- **Auto-renewal enabled:** Auto-charge same days, new code generated, seamless access
- **Auto-renewal charge fails:** 3-day grace period, system retries, student reminded to update payment method
- **Expires mid-session:** Student completes current session, blocked from future sessions

---

## Host Plan Tiers

All hosts start on **Starter** plan. No host ever pays. Plan determines:
- Platform commission %
- Feature access
- Free admission slots
- Student limits

### Tier Details

| Feature | Starter | Growth | Pro | Elite |
|---------|---------|--------|-----|-------|
| **Commission** | 25% | 20% | 15% | 10% |
| **Active Classes** | 3 | 8 | 20 | Unlimited |
| **Max Students/Class** | 30 | 75 | 200 | Unlimited |
| **Sessions/Day** | 2 | 5 | 10 | Unlimited |
| **Video Mode** | External only | Built-in | Built-in | Built-in |
| **Recording** | None | 7-day archive | 30-day archive | Unlimited |
| **Custom Branding** | ❌ | ❌ | ✅ | ✅ |
| **Discount Codes** | ❌ | ❌ | ✅ | ✅ |
| **Course Bundles** | ❌ | ❌ | ✅ | ✅ |
| **Free Slots/Month** | 1 | 2 | 3 | 5 |
| **Waitlist Feature** | ✅ | ✅ | ✅ | ✅ |
| **Payouts** | Bi-weekly | Weekly | Per-transaction | Per-transaction |
| **Support** | Community | Email | Priority | Dedicated |
| **Analytics** | Basic | Advanced | Premium | Custom |

### Upgrade Thresholds

- **Starter → Growth:** 23 paying students
- **Growth → Pro:** 73 paying students
- **Pro → Elite:** 198 paying students + 4.5-star average rating

### Founding Host Badge

First 50 hosts get permanent "Founding Host" badge + 10 ranking points (tiebreaker)

### Host Ranking

**Primary factors:**
- Average student rating
- Number of active students
- Retention rate
- Engagement score
- Review volume

**Tiebreaker:**
- Tenure + Founding Host bonus

### Waitlist & Grace Period

When host reaches student limit:
- Immediately add new students to waitlist
- Notify host (in-app + email)
- 14-day grace period: can temporarily exceed limit by 10-15%
- Pro plan: Can exceed 120 students for max 90 days to improve rating for Elite
- Must manually upgrade to permanently increase limit

### Free Admission Slots

- Hosts earn free slots based on plan
- Can use for:
  - Special guests
  - Partnerships
  - Community engagement

---

## Student Features

### Dashboard

- **Active Classes:** Classes with active access
- **Expired Classes:** With prominent renewal button
- **Recommended:** Based on interests and reviews
- **Referrals:** Track referral links and earned rewards

### My Classes Section

- View all enrolled classes
- Access codes and trusted devices management
- Auto-renewal status
- Time remaining and renewal options
- Session attendance status

### Trusted Device Management

- View registered devices
- Remove devices
- Change device on same code
- Email verification/OTP for new devices

### Referral Rewards

- Unique referral link
- Track referred students
- View earned free days
- Max 5 rewards/month
- Free days added to current/next subscription

### Account Management

- Profile settings
- Currency selection
- Password/2FA settings
- Email preferences
- Notification settings

---

## Admin Roles & Features

### Five Admin Tiers (Strict Role Separation)

Each admin only sees their designated section.

1. **Support Admin**
   - Respond to support tickets
   - Flag content for moderation
   - Message users

2. **Moderator**
   - Review flagged content
   - Suspend classes
   - Approve/reject content
   - Add notes

3. **Finance Admin**
   - View transactions
   - Process refunds
   - Set commission rates
   - View payouts

4. **Admin**
   - Manage user accounts
   - Suspend/ban users
   - View audit logs
   - Manage platform settings

5. **SuperAdmin**
   - Access all sections
   - Manage other admins
   - System configuration
   - Disaster recovery

### Admin Features

- **Dashboard:** KPIs, charts, activity feed
- **User Management:** Search, filter, suspend, delete
- **Transaction Management:** Filters, details, export
- **Content Moderation:** Queue, approval workflow, history
- **Analytics:** Revenue trends, engagement, geographic
- **Settings:** Commission rates, feature flags, email templates
- **Audit Logs:** All important actions logged
- **Reports:** Export to CSV/PDF

---

## Session Recording & Archives

### Recording Capability

- **Starter:** No recording
- **Growth:** 7-day archive (downloadable)
- **Pro:** 30-day archive (downloadable)
- **Elite:** Unlimited archive (downloadable)

### Recording Format

- **Built-in Video:** Auto-recorded
- **External Video:** Manually upload or link
- **Streaming:** HLS/DASH with adaptive bitrate

### Watermarking

All recordings watermarked with:
- Student email address
- Timestamp
- Class name
- Host name

### Access

- Signed URLs expire after 4 hours
- Accessible from student dashboard
- Cannot be downloaded (stream only)
- Access logged in audit trail

---

## Notifications System

### In-App + Email Notifications

All important notifications sent **both ways**:

1. **Plan Upgrades**
   - Student limit reached
   - Upgrade eligible
   - Upgrade completed

2. **Payments**
   - Enrollment confirmed
   - Auto-renewal failed
   - Refund processed

3. **Referrals**
   - Referral successful
   - Reward earned
   - Monthly limit reached

4. **Host Events**
   - New student enrolled
   - Student waitlist join
   - Session cancelled
   - Student suspension

5. **Content Moderation**
   - Content rejected
   - Class suspended
   - Appeal decision
   - Warning issued

6. **Administrative**
   - Admin action taken
   - Dispute created
   - Support ticket response
   - System maintenance

### Notification Preferences

Students/Hosts can:
- Choose in-app only, email only, or both
- Select notification categories
- Set quiet hours
- Turn off entirely (dangerous)

---

## Analytics & Reporting

### Host Analytics

- **Student Growth:** Chart over time
- **Revenue:** By class, by period
- **Retention:** Repeat vs new students
- **Engagement:** Avg watch time, completion rate
- **Reviews:** Avg rating, trends
- **Sessions:** Attendance, peak times
- **Referrals:** Successful referrals
- **Free Slots:** Used vs available

### Platform Analytics (Admin)

- **Users:** Total, by role, growth
- **Classes:** Total, by category, avg students
- **Revenue:** Total, by payment processor, by host plan
- **Transactions:** Count, avg value, churn
- **Geographic:** Users by country, revenue by region
- **Device:** Browser, OS distribution
- **Engagement:** Avg session duration, completion rate

### Export Functionality

- Download analytics as CSV, PDF, Excel
- Scheduled reports (daily, weekly, monthly)
- Custom report builder
- Data retention (2+ years)

---

## Dispute Resolution & Appeals

### Content Rejection Appeals

Student rejected by moderator can:
- View rejection reason
- Submit appeal with evidence
- Appeal reviewed by different moderator
- Decision within 48 hours
- Automatic notification

### Refund Disputes

- Student can request refund within 30 days
- Reason required
- Auto-approve if requested within 7 days of purchase
- Manual review if after 7 days
- Host can respond/appeal
- Final decision within 7 days

### Host Disputes

- Students can report misleading classes
- Host can respond
- Admin investigates
- Resolution within 7 days

### Appeal Process

1. User submits appeal
2. Automatically assigned to different moderator
3. Review within 48 hours
4. Decision notified (in-app + email)
5. If overturned: full restoration/refund

---

## Multi-Language & Localization

### Supported Languages

Phase 1: English  
Phase 2: Spanish, French, German, Portuguese, Mandarin, Japanese, Arabic, Hindi

### Localization Features

- Currency conversion
- Timezone detection
- RTL language support
- Local payment processors
- Localized email templates
- Translated platform text

---

## Performance & Scalability

### Database Optimization

- Indexes on frequently queried fields
- Pagination for list endpoints
- Data archival for old sessions
- Read replicas for analytics

### Caching Strategy

- Redis for frequently accessed data:
  - Class listings
  - Host profiles
  - User ratings
  - Analytics aggregates

### API Optimization

- Gzip compression
- CDN for static assets
- Request throttling
- Query optimization

### Scalability

- Horizontal pod autoscaling
- Load balancing
- Database sharding by class/user
- Separate analytics database
- Message queue for background jobs

### Performance Targets

- Page load: <2 seconds
- API response: <200ms
- Video startup: <3 seconds
- Concurrent users: 10,000+
- Daily transactions: 100,000+

---

## Future Expansion

### Phase 2 Features

- Host ranking system
- Course bundles and discounts
- Advanced session recording
- Host abandonment protection
- Ban evasion detection
- AI moderation and summarization
- Learning progress tracking
- Certificates of completion

### Phase 3+ Features

- Mobile native apps
- Live polls and quizzes
- Peer-to-peer group sessions
- Institutional partnerships
- Corporate training packages
- Government education partnerships
- White-label platform
- Advanced analytics API

---

## Implementation Priority

### Phase 1 (MVP - 5-6 weeks)
1. User authentication & profiles
2. Flexible pricing system
3. Stripe & Paystack integration
4. Access codes and device verification
5. Basic video (external links or WebRTC)
6. Class creation and browsing
7. Payment processing and fulfillment
8. Basic analytics
9. Admin foundation
10. Support system

### Phase 2 (3-6 months post-launch)
1. Host ranking system
2. Session recording
3. Host plan tier enforcement
4. Referral system
5. Course bundles
6. Advanced analytics
7. Enhanced moderation
8. Progress tracking

### Phase 3+ (12+ months)
1. Mobile apps
2. Institutional features
3. AI integration
4. White-label
5. API platform

---

## Success Metrics

✅ Users can register and login  
✅ Hosts can create classes  
✅ Students can browse and pay  
✅ Access validated on join  
✅ Video sessions work  
✅ Payments process correctly  
✅ Access codes secure  
✅ Analytics tracked  
✅ Admins can moderate  
✅ <2s page load time  
✅ 99.9% uptime  

---

## Security & Compliance

- All passwords hashed (bcrypt)
- JWT tokens secure auth
- HTTPS everywhere
- Database encrypted at rest
- Payment PCI compliance (Stripe/Paystack)
- Regular security audits
- Penetration testing
- GDPR compliant
- Data retention policies
- Disaster recovery plan

---

**This specification is the authoritative guide for all EduTalk development.**  
Last Updated: 2024  
Status: Active
