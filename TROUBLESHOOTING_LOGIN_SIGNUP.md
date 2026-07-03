# 🔧 TROUBLESHOOTING: Login/Signup Not Working

## ✅ Diagnostic Steps

### 1. MongoDB Connection Issue

**Most likely cause**: MongoDB is not running or not accessible

**Check if MongoDB is running:**

```powershell
# Windows - Check if MongoDB service is running
Get-Service MongoDB

# Or check if mongod process exists
Get-Process mongod -ErrorAction SilentlyContinue
```

**Solutions:**

**Option A: Start MongoDB locally (if installed)**

```powershell
# Windows with MongoDB installed
# Start MongoDB service
net start MongoDB

# Or start mongod directly
mongod --dbpath "C:\data\db"
```

**Option B: Use MongoDB Atlas (Cloud)**

```
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a cluster
4. Get connection string
5. Update backend/.env: MONGODB_URI=<connection_string>
```

**Option C: Use Docker MongoDB (Recommended)**

```powershell
# Install Docker if not already installed
# Pull MongoDB image
docker pull mongo:latest

# Run MongoDB container
docker run -d -p 27017:27017 --name edutalk-mongo mongo:latest

# Verify it's running
docker ps
```

---

### 2. Backend API Health Check

**Test if backend is running:**

```bash
curl -X GET http://localhost:5000/api/auth/profile
# Should return 401 Unauthorized (no token) - This is GOOD!

# If you see connection refused: Backend not running
# If you see 500 error: Database not connected
```

**Check backend logs:**

1. Look at the terminal where backend is running
2. Search for error messages
3. Look for "MongoDB Connected" message

---

### 3. Frontend API Connection

**Test frontend API configuration:**

```javascript
// Open browser console (F12) and run:
console.log(import.meta.env.VITE_API_URL);
// Should output: http://localhost:5000/api

// Test API call
fetch("http://localhost:5000/api/auth/profile")
  .then((r) => r.json())
  .then((d) => console.log(d))
  .catch((e) => console.log("Error:", e));
```

---

## 🔨 Common Fixes

### Fix 1: MongoDB Connection

```bash
# Backend Terminal
cd backend

# Check .env file has valid MONGODB_URI
cat .env | grep MONGODB_URI

# If using local MongoDB, ensure it's running
# Windows: net start MongoDB
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Restart backend
npm run dev
```

### Fix 2: Frontend .env Configuration

```bash
# Frontend Terminal
cd frontend

# Verify .env has correct API URL
cat .env | grep VITE_API_URL

# Should show: VITE_API_URL=http://localhost:5000/api

# If wrong, update and rebuild
npm run dev
```

### Fix 3: CORS Issues

```javascript
// If you see CORS error in browser console:
// This means backend CORS is not configured correctly

// Backend should have CORS enabled
// In server.js, check CORS configuration:
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
```

### Fix 4: Clear Browser Cache

```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();

// Then refresh page
window.location.reload();
```

---

## 🚀 Complete Fresh Start

### Step 1: Stop All Servers

```powershell
# Kill any existing processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 2: Start MongoDB

**Option A: Local MongoDB**

```powershell
# Make sure MongoDB is running
net start MongoDB

# Verify it's running
Get-Service MongoDB
```

**Option B: Docker MongoDB**

```powershell
# Start MongoDB in Docker
docker run -d -p 27017:27017 --name edutalk-mongo mongo:latest

# Verify
docker ps
```

### Step 3: Start Backend

```powershell
cd C:\Users\abdul\Desktop\class\backend

# Install dependencies (first time only)
npm install

# Start backend
npm run dev

# Expected output:
# ✓ MongoDB Connected: localhost:27017
# ✓ Server running on port 5000
```

### Step 4: Start Frontend

```powershell
cd C:\Users\abdul\Desktop\class\frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm run dev

# Expected output:
# ✓ VITE v6.x.x ready in XXXms
# ✓ Local: http://localhost:5173/
```

### Step 5: Test Login

1. Open http://localhost:5173 in browser
2. Go to signup page
3. Create test account:
   - Email: test@example.com
   - Password: Test123456!
   - First Name: Test
   - Last Name: User
4. Click Signup
5. Should see redirect to dashboard

---

## 🐛 Debug Checklist

- [ ] MongoDB is running (`docker ps` or `Get-Service MongoDB`)
- [ ] MongoDB connection URI is correct in `.env`
- [ ] Backend is running on port 5000
- [ ] Frontend is running on port 5173
- [ ] VITE_API_URL is set to `http://localhost:5000/api`
- [ ] No CORS errors in browser console
- [ ] No network errors when clicking login/signup
- [ ] Backend logs show API requests
- [ ] JWT_SECRET is set in backend `.env`

---

## 📊 Expected Output

### Backend Console Should Show:

```
✓ MongoDB Connected: localhost:27017
✓ Server running on port 5000
✓ Email scheduler initialized
✓ AI moderation service started
```

### Frontend Console Should Show:

```
✓ VITE v6.x.x ready in 123ms
✓ ➜  Local:   http://localhost:5173/
✓ AuthContext initialized
```

### Test Network Request:

```javascript
// In browser console, after signing up:
fetch("http://localhost:5000/api/auth/profile")
  .then((r) => r.json())
  .then((d) => console.log("Success:", d))
  .catch((e) => console.log("Error:", e));

// Expected: Returns user profile (201 Unauthorized is OK for no token)
```

---

## 🆘 If Still Not Working

### Check Backend Logs

```powershell
# Backend terminal should show:
# If error: "ECONNREFUSED" - MongoDB not running
# If error: "Cannot connect" - Check MONGODB_URI in .env
# If error: "PORT 5000 in use" - Kill process on port 5000
```

### Check Frontend Network Tab

```
Browser DevTools → Network tab
1. Click Signup button
2. Look for POST request to /api/auth/register
3. Check:
   - Status code (should be 201 or 400, not 0)
   - Response data
   - Error message
```

### Verify MongoDB Connection

```powershell
# Test MongoDB connection directly
# Using mongo shell or MongoDB Compass

# Connection string: mongodb://localhost:27017/edutalk

# Should be able to:
1. Connect to database
2. See 'edutalk' database
3. See 'users' collection
```

---

## ✅ Success Indicators

✅ Backend logs show: "MongoDB Connected"  
✅ Frontend loads without errors  
✅ Signup form appears with all fields  
✅ Signup button is clickable  
✅ After signup: Redirected to dashboard  
✅ User data appears in profile

---

**Next Steps**:

1. Verify MongoDB is running
2. Check MONGODB_URI in backend/.env
3. Verify VITE_API_URL in frontend/.env
4. Restart both servers
5. Test signup again
