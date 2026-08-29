// This is the COMPLETE Prisma schema for EduTalk MVP
// To use: Copy this into your /prisma/schema.prisma file
// Then run: npx prisma migrate dev --name init
// Then run: npm run seed

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

model User {
  id                    String @id @default(cuid())
  email                 String @unique @db.VarChar(255)
  password_hash         String?
  name                  String?
  avatar_url            String?
  bio                   String?
  
  // Preferences
  timezone              String @default("UTC")
  preferred_currency    String @default("USD") @db.VarChar(3)
  preferred_locale      String @default("en")
  preferred_theme       String @default("system") // light | dark | system
  
  // Roles (additive booleans - user can be student + host + admin)
  is_host               Boolean @default(false)
  is_admin              Boolean @default(false)
  email_verified        Boolean @default(false)
  
  // OAuth
  google_id             String? @unique
  
  // Payment Providers
  stripe_customer_id    String? @unique
  stripe_connect_id     String? @unique
  paystack_recipient_code String? @unique
  
  // Host Information
  host_plan             String @default("starter") // starter | growth | pro | elite
  host_bio              String?
  host_verified_level   Int @default(0) // 0=unverified, 1=email verified, 2=identity verified
  host_enrollment_count Int @default(0) // For auto-upgrade tracking
  
  // Security
  referral_code         String? @unique @db.VarChar(20)
  two_factor_secret     String?
  two_factor_enabled    Boolean @default(false)
  is_active             Boolean @default(true)
  strike_count          Int @default(0)
  
  // Timestamps
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  hosted_classes        Class[] @relation("HostedClasses")
  subscriptions         Subscription[] @relation("StudentSubscriptions")
  payments              Payment[]
  access_codes          AccessCode[]
  reviews               Review[]
  referrals_given       Referral[] @relation("Referrer")
  referrals_received    Referral[] @relation("Referee")
  admin_audit_logs      AdminAuditLog[]
  notifications         Notification[]
  trusted_devices       TrustedDevice[]
  
  @@index([email])
  @@index([stripe_customer_id])
  @@index([is_host])
  @@index([is_admin])
}

// ============================================================================
// CATEGORIES & TAXONOMY
// ============================================================================

model Category {
  id                    String @id @default(cuid())
  name                  String
  slug                  String @unique
  icon                  String?
  description           String?
  parent_id             String? // Self-reference for hierarchical categories
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  classes               Class[]
  parent                Category? @relation("CategoryHierarchy", fields: [parent_id], references: [id], onDelete: SetNull)
  children              Category[] @relation("CategoryHierarchy")
  
  @@index([slug])
}

// ============================================================================
// CLASSES & SESSIONS
// ============================================================================

model Class {
  id                    String @id @default(cuid())
  host_id               String
  title                 String @db.VarChar(500)
  description           String
  category_id           String
  
  // Pricing
  monthly_price_cents   Int // Stored in cents (e.g., $100 = 10000)
  currency              String @default("USD") @db.VarChar(3)
  min_purchase_days     Int @default(1) // 1, 2, 3, 5, or 7 only
  
  // Duration
  duration_type         String @default("ongoing") // fixed | ongoing
  start_date            DateTime?
  end_date              DateTime?
  total_days            Int? // For fixed-duration classes
  
  // Capacity & Settings
  max_students          Int?
  thumbnail_url         String?
  intro_video_url       String?
  video_mode            String @default("external") // builtin | external
  external_link         String?
  
  // Status & Visibility
  status                String @default("draft") // draft | published | active | archived
  visibility            String @default("public") // public | unlisted
  tags                  String[] // Array of tags for search
  
  // Analytics
  avg_rating            Decimal @default(0) @db.Decimal(2, 1)
  total_ratings         Int @default(0)
  total_enrolled        Int @default(0)
  
  // Features
  affiliate_enabled     Boolean @default(false)
  
  // Timestamps
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  host                  User @relation("HostedClasses", fields: [host_id], references: [id], onDelete: Cascade)
  category              Category @relation(fields: [category_id], references: [id], onDelete: SetNull)
  schedules             ClassSchedule[]
  sessions              ClassSession[]
  subscriptions         Subscription[]
  payments              Payment[]
  reviews               Review[]
  
  @@index([host_id])
  @@index([category_id])
  @@index([status])
  @@index([visibility])
  @@fulltext([title, description]) // For full-text search
}

model ClassSchedule {
  id                    String @id @default(cuid())
  class_id              String
  day_of_week           Int // 0-6 (0=Sunday, 6=Saturday)
  start_time            String @db.Time // HH:MM format
  duration_minutes      Int
  timezone              String @db.VarChar(100)
  is_active             Boolean @default(true)
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  class                 Class @relation(fields: [class_id], references: [id], onDelete: Cascade)
  sessions              ClassSession[]
  
  @@index([class_id])
  @@unique([class_id, day_of_week]) // One schedule per day per class
}

model ClassSession {
  id                    String @id @default(cuid())
  class_id              String
  schedule_id           String? // Nullable for bonus/special sessions
  start_time            DateTime
  end_time              DateTime
  
  status                String @default("scheduled") // scheduled | live | completed | cancelled
  cancellation_reason   String?
  
  // Video
  video_room_id         String? // For built-in video
  external_meeting_url  String?
  
  // Recording (Phase 2)
  recording_url         String?
  recording_id          String?
  
  // Flags
  is_preview            Boolean @default(false)
  actual_start          DateTime?
  actual_end            DateTime?
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  class                 Class @relation(fields: [class_id], references: [id], onDelete: Cascade)
  schedule              ClassSchedule? @relation(fields: [schedule_id], references: [id], onDelete: SetNull)
  
  @@index([class_id])
  @@index([schedule_id])
  @@index([status])
  @@index([start_time])
}

// ============================================================================
// SUBSCRIPTIONS & PAYMENTS
// ============================================================================

model Subscription {
  id                    String @id @default(cuid())
  student_id            String
  class_id              String
  host_id               String
  
  days_purchased        Int
  total_days_in_chain   Int // Total days across all purchases in chain
  
  start_date            DateTime
  end_date              DateTime
  
  amount_cents          Int // Amount paid (in cents)
  daily_rate_cents      Int // Calculated daily rate for this tier
  currency              String @default("USD") @db.VarChar(3)
  
  // Continuation Chain (for chunk buying without penalty)
  chain_id              String? // Links subscriptions together
  chain_sequence        Int @default(1) // Order in the chain
  previous_sub_id       String? // Link to previous subscription in chain
  
  // Auto-Renewal
  auto_renew            Boolean @default(false)
  auto_renew_days       Int?
  
  status                String @default("pending") // pending | active | expired | cancelled | refunded
  stripe_subscription_id String? // For recurring subscriptions
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  student               User @relation("StudentSubscriptions", fields: [student_id], references: [id], onDelete: Cascade)
  class                 Class @relation(fields: [class_id], references: [id], onDelete: Cascade)
  host                  User @relation(fields: [host_id], references: [id], onDelete: Cascade)
  previous              Subscription? @relation("SubscriptionChain", fields: [previous_sub_id], references: [id])
  next                  Subscription? @relation("SubscriptionChain")
  access_codes          AccessCode[]
  payments              Payment[]
  
  @@index([student_id])
  @@index([class_id])
  @@index([chain_id])
  @@index([status])
}

model Payment {
  id                    String @id @default(cuid())
  student_id            String
  class_id              String
  host_id               String
  subscription_id       String
  chain_id              String // For tracking all purchases in a chain
  
  // Amount Breakdown (all in cents)
  amount_cents          Int // Total amount student paid
  platform_fee_cents    Int // Platform's fee (varies by plan: 25/20/15/10%)
  host_earning_cents    Int // Host's immediate earning
  stripe_fee_cents      Int? // Stripe's fee (~2.9% + $0.30)
  reserve_cents         Int @default(0) // 12.5% holdback for 30-60 days
  
  // Currency & Exchange
  currency              String @default("USD") @db.VarChar(3)
  charge_currency       String? // Currency charged (may differ from platform currency)
  charge_amount         Decimal? @db.Decimal(12, 2) // Actual charged amount
  exchange_rate         Decimal @default(1) @db.Decimal(12, 6) // For currency conversion
  
  // Purchase Details
  days_purchased        Int
  daily_rate_cents      Int // The daily rate used for this purchase
  is_continuation       Boolean @default(false) // Is this a continuation purchase?
  continuation_discount_cents Int @default(0) // How much was discounted vs fresh price
  
  // Payment Processor Details
  stripe_payment_id     String? // Stripe Payment Intent ID
  paystack_reference    String? // Paystack payment reference
  discount_code_id      String?
  
  status                String @default("pending") // pending | completed | failed | refunded
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  student               User @relation(fields: [student_id], references: [id], onDelete: Cascade)
  class                 Class @relation(fields: [class_id], references: [id], onDelete: Cascade)
  host                  User @relation(fields: [host_id], references: [id], onDelete: Cascade)
  subscription          Subscription @relation(fields: [subscription_id], references: [id], onDelete: Cascade)
  
  @@index([student_id])
  @@index([class_id])
  @@index([subscription_id])
  @@index([stripe_payment_id])
  @@index([paystack_reference])
  @@index([status])
  @@index([created_at])
}

// ============================================================================
// ACCESS CONTROL
// ============================================================================

model AccessCode {
  id                    String @id @default(cuid())
  code                  String @unique @db.VarChar(20) // ET-XXXX-XXXX-XXXX format
  student_id            String
  student_email         String @db.VarChar(255)
  class_id              String
  host_id               String
  subscription_id       String
  
  valid_from            DateTime
  valid_until           DateTime
  status                String @default("active") // active | expired | revoked
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  student               User @relation(fields: [student_id], references: [id], onDelete: Cascade)
  class                 Class @relation(fields: [class_id], references: [id], onDelete: Cascade)
  host                  User @relation(fields: [host_id], references: [id], onDelete: Cascade)
  subscription          Subscription @relation(fields: [subscription_id], references: [id], onDelete: Cascade)
  trusted_devices       TrustedDevice[]
  
  @@index([code])
  @@index([student_email])
  @@index([class_id])
  @@index([status])
  @@index([valid_until])
}

model TrustedDevice {
  id                    String @id @default(cuid())
  access_code_id        String
  user_id               String
  
  device_fingerprint    String // Hash of device characteristics
  device_name           String? // User-friendly name (Browser, Phone, etc.)
  user_agent            String?
  ip_address            String?
  
  trusted_at            DateTime @default(now())
  last_used             DateTime @default(now())
  created_at            DateTime @default(now())
  
  // Relations
  access_code           AccessCode @relation(fields: [access_code_id], references: [id], onDelete: Cascade)
  user                  User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([access_code_id])
  @@index([user_id])
  @@unique([access_code_id, device_fingerprint]) // One device per code max
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

model Review {
  id                    String @id @default(cuid())
  class_id              String
  student_id           String
  host_id               String
  
  rating                Int // 1-5
  text                  String?
  
  // Category ratings (JSON object)
  teaching_quality      Int? // 1-5
  content_quality       Int? // 1-5
  pacing                Int? // 1-5
  materials             Int? // 1-5
  engagement            Int? // 1-5
  
  moderation_flags      String[] // Array of flagged issues
  verified_purchase     Boolean @default(false)
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
  
  // Relations
  class                 Class @relation(fields: [class_id], references: [id], onDelete: Cascade)
  student               User @relation(fields: [student_id], references: [id], onDelete: Cascade)
  host                  User @relation(fields: [host_id], references: [id], onDelete: Cascade)
  
  @@index([class_id])
  @@index([student_id])
  @@index([rating])
  @@unique([class_id, student_id]) // One review per student per class
}

// ============================================================================
// REFERRALS & REWARDS
// ============================================================================

model Referral {
  id                    String @id @default(cuid())
  referrer_id           String
  referee_id            String
  referral_code         String @unique @db.VarChar(20)
  
  status                String @default("pending") // pending | completed | expired
  credit_amount         Int @default(0) // In cents
  
  created_at            DateTime @default(now())
  expires_at            DateTime
  completed_at          DateTime?
  
  // Relations
  referrer              User @relation("Referrer", fields: [referrer_id], references: [id], onDelete: Cascade)
  referee               User @relation("Referee", fields: [referee_id], references: [id], onDelete: Cascade)
  
  @@index([referrer_id])
  @@index([referee_id])
  @@index([referral_code])
  @@index([status])
}

// ============================================================================
// ADMIN & MODERATION
// ============================================================================

model AdminAuditLog {
  id                    String @id @default(cuid())
  admin_id              String
  action                String // 'CREATE', 'UPDATE', 'DELETE', 'BAN', 'REFUND', etc.
  resource_type         String // 'User', 'Class', 'Payment', etc.
  resource_id           String
  changes               String? // JSON of what changed
  reason                String?
  ip_address            String?
  
  created_at            DateTime @default(now())
  
  // Relations
  admin                 User @relation(fields: [admin_id], references: [id], onDelete: Cascade)
  
  @@index([admin_id])
  @@index([resource_type])
  @@index([created_at])
}

model ModerationLog {
  id                    String @id @default(cuid())
  user_id               String
  class_id              String?
  
  violation_type        String // 'hate_speech', 'spam', 'fraud', etc.
  severity              Int // 1-3: low, medium, high
  content               String? // What was flagged
  status                String @default("open") // open | escalated | resolved | false_positive
  
  created_at            DateTime @default(now())
  resolved_at           DateTime?
  
  @@index([user_id])
  @@index([class_id])
  @@index([status])
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

model Notification {
  id                    String @id @default(cuid())
  user_id               String
  event_type            String // 'class_starting', 'payment_received', 'new_review', etc.
  title                 String
  body                  String
  link                  String?
  
  is_read               Boolean @default(false)
  read_at               DateTime?
  
  created_at            DateTime @default(now())
  
  // Relations
  user                  User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@index([is_read])
}

model NotificationPreference {
  id                    String @id @default(cuid())
  user_id               String @unique
  
  // Preference flags (1 = enabled, 0 = disabled)
  email_class_starting  Boolean @default(true)
  email_payment_received Boolean @default(true)
  email_review_received Boolean @default(true)
  email_enrollment      Boolean @default(true)
  email_no_show         Boolean @default(true)
  
  in_app_all            Boolean @default(true)
  
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt
}

// ============================================================================
// ANALYTICS & TRACKING
// ============================================================================

model AnalyticsEvent {
  id                    String @id @default(cuid())
  user_id               String?
  event_name            String
  event_data            String? // JSON
  
  created_at            DateTime @default(now())
  
  @@index([user_id])
  @@index([event_name])
  @@index([created_at])
}

// ============================================================================
// FUTURE: PHASE 2 FIELDS (placeholder, to be used in Phase 2)
// ============================================================================

// model HostStats {
//   id                    String @id @default(cuid())
//   host_id               String @unique
//   total_students        Int @default(0)
//   total_revenue         Int @default(0) // in cents
//   avg_rating            Decimal @db.Decimal(2, 1)
//   completed_sessions    Int @default(0)
//   updated_at            DateTime @updatedAt
// }

// model RecordingSession {
//   id                    String @id @default(cuid())
//   session_id            String
//   class_id              String
//   host_id               String
//   video_url             String
//   duration_seconds      Int
//   storage_size          Int // in bytes
//   created_at            DateTime @default(now())
// }
