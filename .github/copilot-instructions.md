---
model: claude-3.5-sonnet
---

# EduTalk Platform - Development Guidelines

## Project Overview
This is a full-stack paid video conferencing and virtual classroom platform built with React (frontend) and Node.js/Express (backend). Users can teach live classes with payment requirements, and students can enroll based on flexible tiered pricing.

## Technology Stack
- **Frontend**: React 18 + Vite + React Router v6 + Axios
- **Backend**: Node.js + Express.js + MongoDB + Stripe
- **Authentication**: JWT (JSON Web Tokens) + bcryptjs
- **Payment**: Stripe API
- **Database**: MongoDB (local or Atlas)

## Project Structure
```
class/
├── backend/               # Express API server
│   ├── src/
│   │   ├── config/       # Database & external service config
│   │   ├── controllers/  # Business logic handlers
│   │   ├── models/       # MongoDB schemas
│   │   ├── middleware/   # Authentication & error handling
│   │   ├── routes/       # API endpoint definitions
│   │   ├── utils/        # Utilities (auth, pricing, etc.)
│   │   └── server.js     # Express app setup & startup
│   ├── package.json
│   ├── .env.example
│   ├── .env
│   └── README.md
│
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── context/      # Global state (AuthContext)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components (routed)
│   │   ├── styles/       # CSS stylesheets
│   │   ├── utils/        # API client & utilities
│   │   ├── App.jsx       # Main app component
│   │   └── main.jsx      # React entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── .env
│   └── README.md
│
├── README.md             # Main project documentation
├── SETUP.md             # Installation & setup guide
└── .gitignore
```

## Key Features Implemented (Phase 1)

### Student Features
✅ User registration & login
✅ Browse and search classes
✅ Class filtering by category
✅ Detailed class information
✅ Flexible enrollment (1-30 days)
✅ Tiered pricing calculator
✅ User dashboard
✅ Profile management

### Host Features
✅ Upgrade to host role
✅ Create multiple classes
✅ Set class pricing and scheduling
✅ Host dashboard with analytics
✅ Student enrollment tracking
✅ Plan tier system
✅ Free admission slots

### Payment System
✅ Stripe integration
✅ Dynamic pricing calculations
✅ Payment intent creation
✅ Access code generation
✅ Payment history tracking
✅ Commission split calculations

## Important Algorithms & Formulas

### Pricing Calculation
```javascript
// Daily rates based on commitment level
1-3 days: 1.8x multiplier   ($100/month = $6.00/day)
4-6 days: 1.5x multiplier   ($100/month = $5.00/day)
7-13 days: 1.25x multiplier ($100/month = $4.17/day)
14-20 days: 1.1x multiplier ($100/month = $3.67/day)
21-30 days: 1.0x multiplier ($100/month = $3.33/day)
```

### Continuation Pricing
- When student buys more days later
- Calculate: (total days price - already paid) vs fresh price
- Use whichever is lower

### Commission Split
```
Platform Commission: 25% (Starter) to 10% (Elite)
Stripe Fee: ~2.9% + $0.30
Host Earnings: Total - Platform - Stripe
```

### Access Code Generation
- Format: PC-XXXX-XXXX-XXXX
- 12 alphanumeric characters (30 possible chars)
- ~531 billion possible combinations
- Tied to email and date range

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile (protected)
- PUT /api/auth/profile (protected)
- POST /api/auth/upgrade-to-host (protected)

### Classes
- GET /api/classes (browse)
- GET /api/classes/:classId
- POST /api/classes (host only)
- PUT /api/classes/:classId (host only)
- DELETE /api/classes/:classId (host only)
- GET /api/classes/my-classes (host)

### Payments
- POST /api/payments/create-intent
- POST /api/payments/confirm
- GET /api/payments/history

## Database Models

### User
- Authentication credentials
- Profile information
- Host verification & Stripe Connect ID
- Plan tier (starter/growth/pro/elite)
- Analytics aggregates

### Class
- Class metadata (title, description, category)
- Pricing configuration
- Schedule definition
- Recording settings
- Enrollment statistics

### Session
- Scheduled & actual times
- Recording data
- Attendee tracking
- Chat/discussion data

### Subscription
- Student-class relationship
- Access code (unique, tied to email)
- Payment chain tracking
- Progress tracking

### Payment
- Transaction record
- Commission breakdown
- Stripe reference
- Refund information

### Review
- Star ratings & categories
- Text feedback
- Moderation flags

## Development Workflow

### Adding a New Feature

1. **Backend**
   - Add model to `src/models/` if needed
   - Create controller in `src/controllers/`
   - Define routes in `src/routes/`
   - Add middleware if authentication needed

2. **Frontend**
   - Create page component in `src/pages/` or component in `src/components/`
   - Add CSS in `src/styles/`
   - Call API via `src/utils/api.js`
   - Update routing in `App.jsx`

3. **Testing**
   - Use `curl` or Postman for backend
   - Manual testing in browser for frontend

### Common Tasks

#### Add a new API endpoint
1. Create controller function in appropriate file
2. Add route to corresponding route file
3. Import route in `server.js`
4. Call from frontend using `api.js` client

#### Add a new page
1. Create `.jsx` file in `src/pages/`
2. Add route in `App.jsx`
3. Create corresponding `.css` in `src/styles/`
4. Add navigation link in `Header.jsx` if needed

#### Modify database schema
1. Update model in `src/models/`
2. Existing data will need migration
3. Update controller to handle new fields

## Environment Variables

### Backend .env
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutalk
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
FRONTEND_URL=http://localhost:5173
```

### Frontend .env
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Running the Project

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev  # Runs on localhost:5000

# Terminal 2: Frontend
cd frontend
npm install
npm run dev  # Runs on localhost:5173
```

## Code Style Guidelines

- Use ES6+ syntax (arrow functions, destructuring, etc.)
- Components: Functional components with hooks
- CSS: BEM naming convention (Block__Element--Modifier)
- Database: Use async/await with try-catch
- Error handling: Consistent error messages
- Comments: Explain 'why', not 'what'

## Security Best Practices

- Never commit `.env` files
- Validate all user inputs
- Hash passwords with bcrypt
- Use JWT for authentication
- Stripe handles payment security (PCI compliant)
- Protect sensitive routes with middleware
- Rate limit API endpoints
- Use HTTPS in production
- Sanitize data before storage

## Performance Considerations

- Database indexes on frequently queried fields
- Pagination for list endpoints
- Lazy loading for images
- Code splitting in frontend
- Redis caching for frequent queries
- Compress API responses

## Debugging Tips

- Backend: Check MongoDB connection, check JWT token validity
- Frontend: Check browser console, check network tab
- Payment: Use Stripe test cards (4242 4242 4242 4242)
- CORS: Check backend CORS configuration
- Auth: Verify token is in localStorage

## Phase 2+ Features

- Real-time video with WebRTC
- Session recording & streaming
- AI-powered features (moderation, summarization)
- Email notifications
- Advanced analytics
- Mobile PWA app
- Multi-language support
- Host suspension system
- Refund processing
- Course bundles & discounts

## Useful Commands

```bash
# Backend
npm run dev              # Start with nodemon
npm start               # Production start
npm test               # Run tests

# Frontend
npm run dev            # Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Lint code

# Git
git clone <repo>
git checkout -b feature/name
git commit -am "description"
git push origin feature/name
```

## Resources

- MongoDB: https://docs.mongodb.com/
- Express: https://expressjs.com/
- React: https://react.dev/
- Stripe: https://stripe.com/docs
- Vite: https://vitejs.dev/
- JWT: https://jwt.io/

## Notes for Future Developers

- Pricing algorithm is complex - test thoroughly
- Access codes must be unique and non-transferable
- Payment split must include Stripe fees
- Plan tiers unlock automatically but need activation
- Recording system placeholder needs real implementation
- Email notifications not yet implemented
- Video integration is stub only
- AI features are placeholder

---

Last Updated: May 2024
