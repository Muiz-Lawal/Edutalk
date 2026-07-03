# Quick Start Guide - EduTalk Platform

## Prerequisites

- Node.js 16 or higher
- npm or yarn
- MongoDB (local or MongoDB Atlas cloud)
- Stripe account (for payment testing)

## Installation & Setup

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (already included as template)
# Update .env with your actual configuration:
# - MongoDB connection string
# - Stripe API keys
# - JWT secret
# - OpenAI API key (optional for Phase 1)

# Start MongoDB (if using local)
mongod

# Start backend server
npm run dev
```

Backend will be available at: http://localhost:5000

### 2. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Update .env if needed:
# - Backend API URL
# - Stripe public key

# Start frontend development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## Verification

### Test Backend

```bash
# In browser or with curl
GET http://localhost:5000/api/health
# Should return: { "status": "OK" }
```

### Test Frontend

- Open http://localhost:5173 in your browser
- You should see the EduTalk landing page

## First Steps in the App

1. **Create an Account**
   - Click "Sign Up" on landing page
   - Fill in your details
   - Check "I want to teach classes" if you want to be a host
   - Click "Sign Up"

2. **Browse Classes** (As a Student)
   - Click "Browse Classes"
   - Search or filter by category
   - Click on a class to see details
   - Try the enrollment form (note: payment won't actually process without valid Stripe keys)

3. **Create a Class** (As a Host)
   - Go to "Host Dashboard"
   - Click "Create a New Class"
   - Fill in class details:
     - Title, description, category
     - Monthly price
     - Schedule (days and times)
     - Video mode selection
   - Save the class

4. **View Analytics**
   - Host Dashboard shows:
     - Total classes
     - Active students
     - Plan tier
     - Average rating

## Environment Variables Reference

### Backend (.env)

```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/edutalk

JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

OPENAI_API_KEY=sk-...

FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379 (optional)
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Troubleshooting

### MongoDB Connection Error

- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Try: `mongod` or verify MongoDB Atlas connection string

### Port Already in Use

```bash
# Kill process on port 5000 (backend)
# Windows: netstat -ano | findstr :5000
# Then: taskkill /PID <PID> /F

# Kill process on port 5173 (frontend)
# macOS/Linux: lsof -i :5173
# Then: kill -9 <PID>
```

### CORS Errors

- Ensure FRONTEND_URL matches your frontend URL
- Check backend CORS configuration
- Verify both servers are running

### Stripe Errors

- Verify API keys in .env
- Use test keys (sk*test*..., pk*test*...)
- Check Stripe Dashboard for errors

## Database Cleanup

### Reset MongoDB Database

```bash
# Connect to MongoDB
mongo

# Switch to edutalk database
use edutalk

# Drop all collections
db.dropDatabase()

# Exit
exit
```

## API Testing

### Create a User (via curl or Postman)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Classes

```bash
curl http://localhost:5000/api/classes
```

## Project File Structure

```
class/
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── models/       # MongoDB schemas
│   │   ├── controllers/  # Business logic
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, error handling
│   │   └── utils/        # Helpers (pricing, auth)
│   ├── package.json
│   ├── .env              # Environment config
│   └── README.md
│
├── frontend/             # React + Vite app
│   ├── src/
│   │   ├── pages/        # Route pages
│   │   ├── components/   # React components
│   │   ├── context/      # State management
│   │   ├── hooks/        # Custom hooks
│   │   ├── styles/       # CSS files
│   │   └── utils/        # API client
│   ├── package.json
│   ├── .env              # Environment config
│   ├── vite.config.js
│   └── README.md
│
├── README.md             # Main documentation
└── .gitignore
```

## Next Steps for Development

1. **Implement Payment Processing**
   - Add Stripe form on enrollment card
   - Test payment flow with Stripe test cards

2. **Add Video Integration**
   - Choose video platform (Zoom, Daily.co, Agora)
   - Implement video room creation/joining

3. **Build Session Recording**
   - Store recordings on cloud storage (S3, Cloudinary)
   - Process with transcription/summarization

4. **Add Notifications**
   - Email service (SendGrid, Mailgun)
   - Session reminders, payment confirmations

5. **Host Analytics Dashboard**
   - Student engagement charts
   - Revenue graphs
   - Attendance trends

## Performance Tips

- Frontend: Enable code splitting with React Router lazy loading
- Backend: Add caching with Redis
- Database: Add indexes to frequently queried fields
- API: Implement pagination for list endpoints

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use HTTPS in production
- [ ] Validate all user inputs
- [ ] Rate limit API endpoints
- [ ] Never commit .env files
- [ ] Use environment variables for secrets
- [ ] Enable CORS only for your domain
- [ ] Hash passwords with bcrypt
- [ ] Validate Stripe webhooks

## Support & Resources

- MongoDB Docs: https://docs.mongodb.com/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/
- Stripe Docs: https://stripe.com/docs
- Vite Docs: https://vitejs.dev/

---

Happy coding! 🚀
