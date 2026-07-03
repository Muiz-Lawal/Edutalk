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
