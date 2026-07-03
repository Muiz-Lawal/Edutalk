# EduTalk - Paid Video Conferencing & Virtual Classroom Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v16+-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Integration-blue)](https://stripe.com/)

A comprehensive full-stack web application for live video conferencing and virtual classroom instruction. EduTalk enables educators to create and monetize live classes with flexible pricing models while providing students with secure, easy-to-use learning experiences.

**Live classes require payment before entry** - ensuring instructor commitment and platform sustainability.

## 🎯 Key Features

### For Students

- 🎓 Browse and search classes by category, skill level, and keywords
- 💳 Flexible enrollment: Pay for 1-30 days with intelligent tiered pricing
- 📊 View detailed class information, schedules, and student reviews
- 🎥 Watch live sessions or access on-demand recordings
- ⭐ Rate and review classes after completion
- 📈 Track learning progress and attendance
- 🏆 Earn certificates of completion (80%+ attendance)
- 🌍 Multi-language support
- 📱 Fully responsive design

### For Instructors (Hosts)

- 📚 Create and manage unlimited classes
- 💰 Set flexible pricing with minimum purchase requirements
- 📅 Schedule recurring sessions with customizable times
- ✅ Host verification through Stripe Identity
- 🎬 Automatic session recording and HLS/DASH streaming
- 📊 Advanced analytics dashboard with student insights
- 👥 Manage free admission slots for promotions
- 📈 Tiered plan system (Starter → Growth → Pro → Elite)
- 💸 Real-time earnings tracking and payouts

### Payment & Monetization

- 🔒 Secure Stripe integration with PCI compliance
- 💱 Multi-currency support
- 📊 Intelligent tiered pricing (1-3 days: 1.8x multiplier, increasing discounts for longer commitments)
- 🔄 Continuation pricing for incremental purchases
- 💳 Transparent commission splits based on host plan tier (25% → 10%)
- 📈 Complete payment history and analytics

### Security & Moderation

- 🔐 JWT-based authentication with bcrypt password hashing
- 🛡️ AI-powered content moderation
- ⏱️ Rate limiting on sensitive endpoints
- 🚫 Spam and abuse detection
- 🔒 Secure access code system for class entry
- 📋 Admin dashboard for platform management

## 🏗️ Technology Stack

### Backend

```
Runtime:       Node.js (v16+)
Framework:     Express.js
Database:      MongoDB (Atlas or Local)
Payment:       Stripe API
Auth:          JWT + bcryptjs
Real-time:     Socket.io
Scheduling:    node-cron
Email:         SendGrid & Nodemailer
Moderation:    OpenAI API
```

### Frontend

```
Framework:     React 18
Bundler:       Vite
Routing:       React Router v6
HTTP Client:   Axios
Payments:      Stripe React Components
Internationalization: i18next
Media Streaming: HLS.js
Real-time:     Socket.io Client
Charts:        Recharts
```

## 📦 Project Structure

```
edutalk/
├── backend/                        # Express.js API Server
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js  # Auth & user management
│   │   │   ├── classController.js # Class CRUD operations
│   │   │   ├── paymentController.js # Payment processing
│   │   │   ├── sessionController.js# Session management
│   │   │   ├── subscriptionController.js
│   │   │   ├── reviewController.js
│   │   │   └── adminController.js # Admin dashboard
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT authentication
│   │   │   ├── errorHandler.js    # Global error handling
│   │   │   ├── validation.js      # Request validation
│   │   │   └── rateLimit.js       # Rate limiting
│   │   ├── models/
│   │   │   ├── User.js            # User schema & methods
│   │   │   ├── Class.js           # Class schema
│   │   │   ├── Session.js         # Session schema
│   │   │   ├── Subscription.js    # Subscription tracking
│   │   │   ├── Payment.js         # Payment records
│   │   │   ├── Review.js          # Reviews & ratings
│   │   │   └── Admin.js           # Admin settings
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── classRoutes.js
│   │   │   ├── paymentRoutes.js
│   │   │   ├── subscriptionRoutes.js
│   │   │   ├── reviewRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   ├── auth.js            # Auth helpers
│   │   │   ├── pricing.js         # Pricing algorithms
│   │   │   ├── accessCode.js      # Access code generation
│   │   │   ├── emailService.js    # Email handling
│   │   │   ├── stripeService.js   # Stripe utilities
│   │   │   └── validators.js      # Input validation
│   │   └── server.js              # Express app setup
│   ├── .env.example               # Environment template
│   ├── package.json
│   └── README.md
│
├── frontend/                       # React + Vite App
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ClassCard.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── AuthForm.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   └── ...
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Auth state
│   │   │   └── ClassContext.jsx   # Classes state
│   │   ├── hooks/
│   │   │   ├── useAuth.js         # Auth custom hook
│   │   │   ├── useApi.js          # API calling hook
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Register.jsx       # Registration
│   │   │   ├── Classes.jsx        # Browse classes
│   │   │   ├── ClassDetail.jsx    # Class details
│   │   │   ├── Dashboard.jsx      # User dashboard
│   │   │   ├── HostDashboard.jsx  # Host analytics
│   │   │   ├── CreateClass.jsx    # Create class
│   │   │   ├── PaymentPage.jsx    # Payment page
│   │   │   ├── AdminPanel.jsx     # Admin dashboard
│   │   │   └── ...
│   │   ├── styles/                # CSS stylesheets
│   │   ├── utils/
│   │   │   └── api.js             # Axios client
│   │   ├── App.jsx                # Main app component
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tsconfig.json
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── .gitignore
├── README.md                      # This file
├── SETUP.md                       # Installation guide
├── LICENSE
└── package.json                   # Root package.json (optional)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Stripe Account** (for payments)
- **SendGrid Account** (for email)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/edutalk.git
cd edutalk
```

#### 2. Setup Backend

```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Configure your .env with:
# MONGODB_URI=mongodb://localhost:27017/edutalk
# JWT_SECRET=your_secret_key_here
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLISHABLE_KEY=pk_test_...
# SENDGRID_API_KEY=...
# NODE_ENV=development

npm run dev
# Backend runs on http://localhost:5000
```

#### 3. Setup Frontend

```bash
cd ../frontend
npm install

# Create .env file
cp .env.example .env

# Configure your .env with:
# VITE_API_URL=http://localhost:5000/api
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

npm run dev
# Frontend runs on http://localhost:5173
```

### Verify Installation

1. Open http://localhost:5173 in your browser
2. Create an account
3. Explore the platform

For detailed setup instructions, see [SETUP.md](./SETUP.md)

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register         # User registration
POST   /api/auth/login            # User login
GET    /api/auth/profile          # Get profile (protected)
PUT    /api/auth/profile          # Update profile (protected)
POST   /api/auth/upgrade-to-host  # Upgrade to host (protected)
```

### Class Management

```
GET    /api/classes               # List all classes (with filters)
GET    /api/classes/:id           # Get class details
POST   /api/classes               # Create class (host only)
PUT    /api/classes/:id           # Update class (host only)
DELETE /api/classes/:id           # Delete class (host only)
GET    /api/classes/my-classes    # Get user's classes
```

### Payments

```
POST   /api/payments/create-intent   # Create payment intent
POST   /api/payments/confirm         # Confirm payment
GET    /api/payments/history         # Payment history
```

### Sessions

```
GET    /api/sessions              # List sessions
GET    /api/sessions/:id          # Session details
POST   /api/sessions              # Create session (host)
PUT    /api/sessions/:id          # Update session (host)
GET    /api/sessions/:id/recording # Access recording
```

### Admin

```
GET    /api/admin/dashboard       # Admin stats
GET    /api/admin/users           # List users
GET    /api/admin/analytics       # Platform analytics
```

Full API documentation available in [backend/README.md](./backend/README.md)

## 💳 Pricing Model

### Tiered Daily Rates

```
1-3 days:     1.8x multiplier    ($100/month → $6.00/day)
4-6 days:     1.5x multiplier    ($100/month → $5.00/day)
7-13 days:    1.25x multiplier   ($100/month → $4.17/day)
14-20 days:   1.1x multiplier    ($100/month → $3.67/day)
21-30 days:   1.0x multiplier    ($100/month → $3.33/day)
```

### Commission Structure

| Host Plan | Commission | Platform Fee |
| --------- | ---------- | ------------ |
| Starter   | 25%        | Yes          |
| Growth    | 20%        | Yes          |
| Pro       | 15%        | Yes          |
| Elite     | 10%        | Yes          |

_Plus Stripe processing fees (~2.9% + $0.30)_

## 🔐 Security

- ✅ JWT-based authentication with secure token storage
- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ CORS protection with origin validation
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation and sanitization
- ✅ Protected API routes with middleware
- ✅ Stripe PCI compliance
- ✅ Environment variable protection
- ✅ SQL injection prevention with MongoDB
- ✅ XSS protection with React

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run integration tests
npm run integration-test

# Manual API testing with curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```

### Frontend Testing

```bash
cd frontend

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📊 Key Algorithms

### Access Code Generation

- Format: `PC-XXXX-XXXX-XXXX`
- 12 alphanumeric characters from 30 possible values
- **~531 billion** possible combinations
- Unique per email and date range
- Non-transferable by default

### Pricing Calculation

```javascript
const dailyRate = monthlyPrice / 30;
const multiplier = getPricingMultiplier(days); // Based on commitment
const totalPrice = dailyRate * days * multiplier;
```

### Commission Split

```javascript
const stripeFee = amount * 0.029 + 0.3;
const platformFee = amount * commissionPercentage;
const hostEarnings = amount - stripeFee - platformFee;
```

## 🐛 Debugging

### Backend Issues

1. Check MongoDB connection: `MONGODB_URI` in `.env`
2. Verify JWT secret is set
3. Check Stripe credentials
4. Review logs: `backend.log`

### Frontend Issues

1. Open browser DevTools (F12)
2. Check Console for errors
3. Check Network tab for API calls
4. Verify `VITE_API_URL` is correct

### Payment Issues

- Use Stripe test card: `4242 4242 4242 4242`
- Use any future expiry date and CVC
- Check Stripe dashboard for transaction details

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m "Add amazing feature"`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please ensure:

- Code follows project style guidelines
- All tests pass
- New features include tests
- Documentation is updated

## 📝 Commit Convention

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Restructure code
perf: Improve performance
test: Add tests
chore: Maintenance tasks
```

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](./LICENSE) file for details.

## 🙋 Support

Need help? Check these resources:

- 📖 [SETUP.md](./SETUP.md) - Installation guide
- 📚 [backend/README.md](./backend/README.md) - Backend docs
- 🎨 [frontend/README.md](./frontend/README.md) - Frontend docs
- 🔗 [Stripe Documentation](https://stripe.com/docs)
- 🍃 [MongoDB Documentation](https://docs.mongodb.com/)

## 🎯 Roadmap

### Phase 2+

- [ ] Real-time video with WebRTC
- [ ] Advanced session recording & streaming
- [ ] AI-powered features (moderation, summarization)
- [ ] Mobile PWA application
- [ ] Course bundles and discounts
- [ ] Advanced analytics
- [ ] Multi-language support expansion
- [ ] Host suspension system
- [ ] Refund processing

## 👥 Team

- **Developer**: [Your Name]
- **Last Updated**: July 2026

## 📧 Contact

For questions or feedback, please reach out to [your-email@example.com]

---

**EduTalk** - Democratizing Education Through Technology 🚀

│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ │ └── Header.jsx # Navigation header
│ │ ├── context/
│ │ │ └── AuthContext.jsx # Global auth state
│ │ ├── hooks/
│ │ │ └── useAuth.js # Auth hook
│ │ ├── pages/
│ │ │ ├── LandingPage.jsx # Home page
│ │ │ ├── LoginPage.jsx # Login
│ │ │ ├── SignupPage.jsx # Signup
│ │ │ ├── BrowseClassesPage.jsx # Class browsing
│ │ │ ├── ClassDetailPage.jsx # Class details
│ │ │ ├── DashboardPage.jsx # Student dashboard
│ │ │ └── HostDashboardPage.jsx # Host dashboard
│ │ ├── styles/
│ │ │ ├── global.css
│ │ │ └── [page-specific].css
│ │ ├── utils/
│ │ │ └── api.js # Axios instance
│ │ ├── App.jsx # Main app component
│ │ └── main.jsx # Entry point
│ ├── index.html
│ ├── vite.config.js
│ └── package.json
│
├── README.md # This file
└── .gitignore

````

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- MongoDB (local or Atlas)
- Stripe account with API keys

### Backend Setup

1. **Install dependencies**

   ```bash
   cd backend
   npm install
````

2. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:

   ```env
   MONGODB_URI=mongodb://localhost:27017/edutalk
   JWT_SECRET=your_jwt_secret_key_here
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start the backend server**

   ```bash
   npm run dev
   ```

   Server will run on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

   Frontend will run on `http://localhost:5173`

### MongoDB Setup

If using local MongoDB:

```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

## 📚 API Endpoints

### Authentication

- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/upgrade-to-host` - Become a host

### Classes

- `GET /api/classes` - Browse all classes
- `GET /api/classes/:classId` - Get class details
- `POST /api/classes` - Create class (requires auth)
- `PUT /api/classes/:classId` - Update class (host only)
- `DELETE /api/classes/:classId` - Delete class (host only)
- `GET /api/classes/my-classes` - Get user's classes (host)

### Payments

- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/history` - Get payment history

## 💳 Payment Flow

1. Student selects class and number of days
2. System calculates price using tiered pricing
3. Create Stripe payment intent
4. Student enters payment information
5. Confirm payment with Stripe
6. Generate access code and subscription
7. Send confirmation email
8. Student can now join sessions

## 💰 Pricing System

### Tiered Daily Rates (based on $100/month example)

| Days  | Daily Rate | Multiplier | Total |
| ----- | ---------- | ---------- | ----- |
| 1-3   | $6.00      | 1.8x       | $18   |
| 4-6   | $5.00      | 1.5x       | $25   |
| 7-13  | $4.17      | 1.25x      | $52   |
| 14-20 | $3.67      | 1.1x       | $73   |
| 21-30 | $3.33      | 1.0x       | $100  |

### Commission Breakdown by Plan Tier

| Plan    | Commission | Max Classes | Max Students | Features                       |
| ------- | ---------- | ----------- | ------------ | ------------------------------ |
| Starter | 25%        | 3           | 25           | External video only            |
| Growth  | 20%        | 5           | 50           | Built-in video + analytics     |
| Pro     | 15%        | 15          | 75           | Recording + custom branding    |
| Elite   | 10%        | Unlimited   | Unlimited    | Premium analytics + co-hosting |

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Access codes tied to email addresses
- Stripe handling of payment data (PCI compliant)
- Rate limiting on payment endpoints
- Video room tokens with expiry

## 📝 Development Notes

### Adding New Features

1. Create models in `backend/src/models/`
2. Implement controllers in `backend/src/controllers/`
3. Create routes in `backend/src/routes/`
4. Build frontend components in `frontend/src/components/` or pages
5. Add API calls in `frontend/src/utils/api.js`

### Database Migrations

Currently using direct MongoDB schema definitions. For future scaling:

- Consider Mongoose plugins for better schema management
- Implement migration system if needed

### Testing

- Backend: Add Jest tests in `backend/tests/`
- Frontend: Add Vitest tests in `frontend/tests/`

## 🚢 Deployment

### Backend (Heroku example)

```bash
git push heroku main
```

### Frontend (Vercel example)

```bash
npm run build
vercel deploy
```

## 📄 Phase 1 Limitations

- No live video (placeholder integration)
- No real session recording (mock recordings)
- No AI features (placeholder)
- No email notifications
- No host suspension system
- No refund processing
- Simplified analytics

## 🔜 Phase 2 Roadmap

- Real-time video conferencing (WebRTC)
- Advanced analytics dashboard
- AI-powered features (summarization, moderation, etc.)
- Email notification system
- Session recording processing
- Host abandonment protection
- Refund management
- Multi-language support
- Mobile app (React Native)

## 📞 Support

For issues or questions:

1. Check existing GitHub issues
2. Create a detailed bug report
3. Include reproduction steps

## 📄 License

MIT License - See LICENSE file for details

## 👥 Authors

- Development Team

---

**Last Updated**: May 2024
**Version**: 1.0.0 (Phase 1 MVP)
