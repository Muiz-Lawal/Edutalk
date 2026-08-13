# Quick Start Guide - EduTalk Platform

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- MongoDB (local or MongoDB Atlas cloud)
- Stripe account (for payment testing)

## Installation & Setup

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env

# Configure backend .env with your values
# - MONGODB_URI
# - JWT_SECRET
# - STRIPE_SECRET_KEY
# - STRIPE_PUBLISHABLE_KEY
# - SENDGRID_API_KEY (optional)

npm run dev
```

Backend will be available at: http://localhost:5000

### 2. Frontend Setup

```bash
cd ../frontend
npm install

# Copy frontend environment template
cp .env.example .env

# Configure frontend .env with:
# VITE_API_URL=http://localhost:5000/api
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

npm run dev
```

Frontend will be available at: http://localhost:5173

## Verification

### Test Backend

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{ "status": "OK" }
```

### Test Frontend

- Open http://localhost:5173 in your browser
- Confirm the landing page loads
- Login or register a user
- For host users, navigate to the Host Dashboard and open Create Class

## First Steps in the App

1. Create an account
2. Browse classes
3. If you want to teach, upgrade to a host and click Create a New Class
4. Fill in class details including title, description, pricing, schedule, and video mode

## Local Linting

From the frontend directory:

```bash
npm run lint
```

## Environment Variables Reference

### Backend (.env)

```bash
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutalk
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@edutalk.com
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Troubleshooting

- Ensure MongoDB is running
- Ensure backend and frontend ports are free
- Validate `.env` values
- If CORS errors occur, confirm FRONTEND_URL matches the browser URL

## API Testing

### Create a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Create a class (host only)

```bash
curl -X POST http://localhost:5000/api/classes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test Class","description":"Test","category":"Technology","monthlyPrice":29.99,"durationType":"ongoing","videoMode":"external","externalVideoLink":"https://example.com"}'
```
