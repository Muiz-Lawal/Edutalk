# 🚀 Phase 1 MVP - Week 1 Implementation Guide

**Status:** ACTIVE - Implementation Started  
**Week:** 1 of 6  
**Duration:** 5 working days  
**Goal:** Complete Authentication & User Profiles  

---

## ✅ Week 1 Checklist

- [ ] Backend Setup Verified
- [ ] MongoDB Connection Working
- [ ] User Model Complete
- [ ] Password Security Implemented
- [ ] Auth Endpoints Working (register, login, profile)
- [ ] Frontend Auth Context Ready
- [ ] Login/Register Pages Working
- [ ] Protected Routes Implemented
- [ ] Full Auth Flow Tested End-to-End
- [ ] Error Handling Complete

---

## 🔧 Step 1: Verify Backend Setup

### Prerequisites
- Node.js 16+ installed
- MongoDB running locally OR MongoDB Atlas configured
- npm dependencies installed ✓

### Start MongoDB (Windows PowerShell)

```powershell
# Option A: MongoDB Installed Locally
mongod

# Option B: MongoDB Atlas (Cloud)
# Update MONGODB_URI in backend/.env with your Atlas connection string
```

### Verify MongoDB Connection

```bash
# Test with MongoDB Compass or mongo shell
mongosh
```

---

## 🏃 Step 2: Start Backend Server

```bash
cd C:\Users\abdul\Desktop\class\backend

# Start with nodemon (development)
npm run dev

# Expected output:
# MongoDB Connected: localhost
# Server running on port 5001
```

### Verify Backend is Running

```bash
# In a new PowerShell terminal, test the server
curl http://localhost:5001/

# Should return: Cannot GET / (which is normal - we need routes)
```

---

## 🏃 Step 3: Start Frontend Server

```bash
cd C:\Users\abdul\Desktop\class\frontend

# Start Vite dev server
npm run dev

# Expected output:
# VITE v5.x.x build c:\...\class\frontend
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

### Verify Frontend is Running

Open browser: `http://localhost:5173`

---

## 🧪 Step 4: Test Authentication Flow

### Test 4.1: User Registration

**Using PowerShell/curl:**

```powershell
# Register a new user
$body = @{
    email = "testuser@example.com"
    password = "Test@123456"
    firstName = "Test"
    lastName = "User"
    isHost = $false
} | ConvertTo-Json

curl -X POST "http://localhost:5001/api/auth/register" `
  -H "Content-Type: application/json" `
  -d $body

# Expected response (200 Created):
# {
#   "message": "User registered successfully",
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "672...",
#     "email": "testuser@example.com",
#     "firstName": "Test",
#     "lastName": "User",
#     "isStudent": true,
#     "isHost": false,
#     "isAdmin": false,
#     "isSuperAdmin": false,
#     "adminRole": null,
#     "planTier": "starter"
#   }
# }
```

**Save the token for next tests:**

```powershell
$token = "YOUR_JWT_TOKEN_HERE"
```

### Test 4.2: User Login

```powershell
$body = @{
    email = "testuser@example.com"
    password = "Test@123456"
} | ConvertTo-Json

curl -X POST "http://localhost:5001/api/auth/login" `
  -H "Content-Type: application/json" `
  -d $body

# Expected response (200 OK):
# Same as registration response
```

### Test 4.3: Get Profile (Protected)

```powershell
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET "http://localhost:5001/api/auth/profile" `
  -H "Authorization: Bearer $token"

# Expected response (200 OK):
# Full user profile object
```

### Test 4.4: Update Profile (Protected)

```powershell
$body = @{
    bio = "I'm a test user learning EduTalk"
    preferredLanguage = "en"
} | ConvertTo-Json

curl -X PUT "http://localhost:5001/api/auth/profile" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body

# Expected response (200 OK):
# Updated user profile
```

### Test 4.5: Upgrade to Host

```powershell
$body = @{
    hostBio = "I teach programming and web development"
    expertise = ["JavaScript", "React", "Node.js"]
} | ConvertTo-Json

curl -X POST "http://localhost:5001/api/auth/upgrade-to-host" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $body

# Expected response (200 OK):
# User with isHost = true
```

---

## 🌐 Step 5: Test Frontend UI

### 5.1: Register via UI

1. Open `http://localhost:5173`
2. Click "Sign Up"
3. Fill in:
   - Email: `testuser2@example.com`
   - Password: `Test@123456`
   - First Name: `John`
   - Last Name: `Doe`
4. Click "Register"
5. Expected: Redirected to dashboard, user logged in

### 5.2: Login via UI

1. Click "Logout" (if logged in)
2. Click "Log In"
3. Fill in:
   - Email: `testuser@example.com`
   - Password: `Test@123456`
4. Click "Login"
5. Expected: Logged in, token in localStorage

### 5.3: View Profile

1. Click profile icon (top right)
2. Expected: See user info, bio, preferences
3. Try to edit: Change bio, click save
4. Refresh page: Bio should persist

### 5.4: Upgrade to Host

1. Click "Become a Host" button
2. Fill in host info:
   - Bio: "I teach programming"
   - Expertise: Select categories
3. Click "Upgrade"
4. Expected: User is now a host, can create classes

---

## 🔒 Security Verification Checklist

- [ ] Passwords are hashed (NOT stored in plain text)
  ```bash
  # Check in MongoDB: passwords should look like: $2a$10$...
  ```

- [ ] JWT tokens are properly signed
  ```bash
  # Token should be: header.payload.signature
  ```

- [ ] Protected endpoints require authentication
  ```bash
  # Try accessing /api/auth/profile without token
  # Should return: 401 Unauthorized
  ```

- [ ] Invalid passwords are rejected
  ```bash
  # Try login with wrong password
  # Should return: 401 Invalid email or password
  ```

- [ ] Tokens expire properly
  ```bash
  # JWT_EXPIRE should be 7d
  # After 7 days, token should be invalid
  ```

---

## ❌ Common Issues & Solutions

### Issue 1: "MongoDB Connection Failed"

**Solution:**
```powershell
# Check if MongoDB is running
Get-Process mongod

# If not running, start MongoDB:
mongod

# Or update MONGODB_URI to use Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/edutalk
```

### Issue 2: "JWT_SECRET not set"

**Solution:**
```bash
# Generate a strong secret
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString() + (New-Guid).ToString()))

# Update backend/.env with JWT_SECRET=<generated_value>
```

### Issue 3: "CORS error on frontend"

**Solution:**
```javascript
// Check backend/.env
FRONTEND_URL=http://localhost:5173

// Should be in allowed origins in server.js
```

### Issue 4: "Token not being sent from frontend"

**Solution:**
```javascript
// Check frontend/utils/api.js
// Should include: headers.Authorization = `Bearer ${token}`

// Verify localStorage has token:
// Open Dev Tools → Application → LocalStorage → token
```

### Issue 5: "Password validation failing"

**Solution:**
```
Password requirements:
- At least 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)
```

---

## 📊 Testing Coverage Matrix

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Register | ✓ | ✓ | Test |
| Login | ✓ | ✓ | Test |
| Get Profile | ✓ | ✓ | Test |
| Update Profile | ✓ | ✓ | Test |
| Password Hashing | ✓ | N/A | Test |
| JWT Generation | ✓ | N/A | Test |
| Token Validation | ✓ | ✓ | Test |
| Upgrade to Host | ✓ | Partial | Complete |
| Protected Routes | ✓ | ✓ | Test |
| Error Handling | ✓ | ✓ | Test |

---

## 📝 Week 1 Daily Progress

### Day 1: Backend Verification
- [ ] MongoDB connection verified
- [ ] Backend server running
- [ ] All dependencies installed
- [ ] Auth endpoints responding

**Todo to mark done:** `w1-backend-setup`

```sql
UPDATE todos SET status = 'done' WHERE id = 'w1-backend-setup';
```

### Day 2: User Model & Password Security
- [ ] User schema verified with all fields
- [ ] Password hashing working
- [ ] Password validation rules applied
- [ ] bcryptjs properly configured

**Todo to mark done:** `w1-user-models`, `w1-password-security`

```sql
UPDATE todos SET status = 'done' WHERE id IN ('w1-user-models', 'w1-password-security');
```

### Day 3: Authentication API Complete
- [ ] Register endpoint fully tested
- [ ] Login endpoint fully tested
- [ ] Profile endpoints working
- [ ] Logout/token refresh working

**Todo to mark done:** `w1-auth-api-register`, `w1-auth-api-login`, `w1-auth-api-profile`, `w1-auth-api-logout`

```sql
UPDATE todos SET status = 'done' WHERE id LIKE 'w1-auth-api%';
```

### Day 4: Frontend Implementation
- [ ] AuthContext properly initialized
- [ ] LoginPage component complete
- [ ] RegisterPage component complete
- [ ] ProfilePage component complete
- [ ] ProtectedRoute wrapper working

**Todo to mark done:** `w1-frontend-auth-context`, `w1-frontend-login-page`, `w1-frontend-register-page`, `w1-frontend-profile-page`, `w1-frontend-protected-route`

```sql
UPDATE todos SET status = 'done' WHERE id LIKE 'w1-frontend%';
```

### Day 5: Testing & Refinement
- [ ] Full auth flow tested end-to-end
- [ ] Error handling verified
- [ ] Edge cases tested
- [ ] Security checklist complete
- [ ] Deployment ready

**Todo to mark done:** `w1-testing-auth-flow`, `w1-error-handling`, `w1-deployment-prep`

```sql
UPDATE todos SET status = 'done' WHERE id LIKE 'w1-testing%' OR id LIKE 'w1-error%' OR id LIKE 'w1-deployment%';
```

---

## 🎯 Week 1 Success Criteria

✅ **100+ users can register and create accounts**
- Test by creating 5+ test accounts

✅ **Login works reliably**
- Test login/logout cycles 10+ times

✅ **Tokens are secure**
- Verify JWT is properly signed
- Verify tokens expire after 7 days
- Verify invalid tokens are rejected

✅ **Profile management works**
- Users can view and edit profiles
- Changes persist across sessions

✅ **Host upgrade works**
- Users can upgrade to host role
- Host-specific fields are populated

✅ **Protected routes work**
- Unauthenticated users cannot access protected endpoints
- Authenticated users can access protected endpoints

✅ **Error handling is clear**
- All errors have descriptive messages
- No generic 500 errors shown to users

---

## 🚀 Week 1 Deliverables

**Backend:**
- ✅ Verified user authentication system
- ✅ Password security implementation
- ✅ JWT token management
- ✅ Profile management endpoints
- ✅ Host upgrade functionality

**Frontend:**
- ✅ AuthContext with all auth functions
- ✅ LoginPage with form validation
- ✅ RegisterPage with password requirements
- ✅ ProfilePage with edit functionality
- ✅ ProtectedRoute wrapper
- ✅ Token storage and retrieval

**Testing:**
- ✅ Unit tests for auth functions
- ✅ Integration tests for API endpoints
- ✅ End-to-end tests for UI flows
- ✅ Security tests for token validation

---

## 📚 Next Week (Week 2)

When Week 1 is complete, move to:
- **Goal:** Host Class Creation
- **Tasks:**
  - Create Class schema
  - Implement class creation API
  - Build class form UI
  - Implement session generation
  - Test scheduling logic

See **PHASE1_IMPLEMENTATION_ROADMAP.md** for details.

---

## 📞 Quick Reference

**Commands to Memorize:**

```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Run tests
npm test

# Check MongoDB
mongosh
db.users.find()

# View logs
cat backend.log
```

**Useful Files:**

- Backend: `backend/src/controllers/authController.js`
- Frontend: `frontend/src/context/AuthContext.jsx`
- API Utils: `frontend/src/utils/api.js`
- Middleware: `backend/src/middleware/auth.js`

---

**Last Updated:** 2024  
**Week 1 Status:** ACTIVE  
**Next Review:** After Day 5 completion

