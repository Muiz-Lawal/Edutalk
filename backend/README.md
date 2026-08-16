# EduTalk Backend API

Node.js/Express backend for the EduTalk platform.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB:

```bash
# Local MongoDB
mongod

# Or use MongoDB Atlas cloud connection
```

4. Run the server:

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutalk

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

OPENAI_API_KEY=sk-xxx

FRONTEND_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/upgrade-to-host` - Upgrade to host (protected)

### Class Endpoints

- `GET /api/classes` - Get all classes (with filtering)
- `GET /api/classes/:classId` - Get class details
- `POST /api/classes` - Create class (host only)
- `PUT /api/classes/:classId` - Update class (host only)
- `DELETE /api/classes/:classId` - Delete class (host only)
- `GET /api/classes/my-classes` - Get user's hosted classes

### Payment Endpoints

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

### Local mock payments (FORCE_MOCK_PAYMENTS)

During local development it's often desirable to avoid calling the real Stripe API. The project supports a mock-safe mode for payments:

- To force purely mocked payments (returns pi_mock_* client secrets and treats them as succeeded), set the environment variable:

  FORCE_MOCK_PAYMENTS=true

- Alternatively, remove or clear STRIPE_SECRET_KEY from your environment to allow the code to fall back to mocked mode.

Notes:
- Use FORCE_MOCK_PAYMENTS=true when running the smoke scripts locally to avoid hitting Stripe or requiring real keys.
- When running with real provider keys in staging/CI, ensure STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are set and FORCE_MOCK_PAYMENTS is not `true`.

## Testing Stripe webhooks locally

The backend exposes a server-side webhook endpoint at `POST /api/payments/webhook` which verifies Stripe signatures using the `STRIPE_WEBHOOK_SECRET` environment variable.

Quick local test with the Stripe CLI (recommended):

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Authenticate the CLI with your Stripe account: `stripe login`
3. Forward webhook events to your local server (replace `--forward-to` if your backend runs on a different port):

   stripe listen --forward-to localhost:5001/api/payments/webhook

4. Trigger a test event:

   stripe trigger payment_intent.succeeded

Manual test (without Stripe CLI) using the provided smoke script:

From the backend folder run:

```bash
# uses STRIPE_WEBHOOK_SECRET from .env or provided env var
STRIPE_WEBHOOK_SECRET=whsec_xxx node smoke/webhook-smoke.mjs
```

The smoke script posts a signed `payment_intent.succeeded` event and asserts the endpoint returns HTTP 200. It does not assert downstream DB side-effects — use the Stripe CLI + real test keys for full end-to-end verification.

## Project Structure

```
src/
├── config/
│   └── db.js                 # Database connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── classController.js   # Class management
│   └── paymentController.js # Payment processing
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js
│   ├── Class.js
│   ├── Session.js
│   ├── Subscription.js
│   ├── Payment.js
│   └── Review.js
├── routes/
│   ├── authRoutes.js
│   ├── classRoutes.js
│   └── paymentRoutes.js
├── utils/
│   ├── auth.js              # Password hashing, JWT
│   ├── pricing.js           # Pricing calculations
│   └── accessCode.js        # Access code generation
└── server.js                # Express app setup
```

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **stripe**: Payment processing
- **jsonwebtoken**: JWT auth
- **bcryptjs**: Password hashing
- **cors**: Cross-origin requests
- **dotenv**: Environment variables
- **uuid**: ID generation

## Development

```bash
# Watch mode
npm run dev

# Production mode
npm start
```

## Key Features Implemented

✅ User authentication with JWT
✅ Role system (student/host)
✅ Class creation and management
✅ Tiered pricing calculations
✅ Continuation pricing
✅ Payment processing with Stripe
✅ Access code generation
✅ Session scheduling
✅ User profiles

## TODO (Phase 2+)

- [ ] Email notifications
- [ ] Session recording storage
- [ ] AI moderation system
- [ ] Host analytics
- [ ] Video room management
- [ ] Refund processing
- [ ] Host abandonment detection
- [ ] Free admission system
- [ ] Discount codes
- [ ] Course bundles

## Database Schema Overview

### User

- Profile info, credentials
- Host details (bio, stripe ID, verification)
- Plan tier and analytics

### Class

- Title, description, category, tags
- Pricing and scheduling
- Recording settings
- Enrollment statistics

### Session

- Scheduled/actual times
- Recording data
- Attendee information
- Chat/discussion data

### Subscription

- Student-class link
- Payment details
- Access code
- Progress tracking

### Payment

- Transaction details
- Commission split
- Refund info
- Stripe reference

### Review

- Rating and feedback
- Moderation status
- Category ratings

## Notes

- All monetary amounts are in cents in calculations
- Access codes are non-transferable and tied to emails
- Pricing is calculated per transaction
- Plans unlock automatically but require activation
