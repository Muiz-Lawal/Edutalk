# 🎯 Phase 1 MVP - Quick Start Commands

**Last Updated:** 2024  
**Status:** Ready to Run  

Copy and paste these commands in order to start Phase 1 MVP development.

---

## 📋 Prerequisites Check

```powershell
# Check Node.js is installed
node -v
# Expected: v16.0.0 or higher

# Check npm is installed
npm -v
# Expected: 7.0.0 or higher

# Check MongoDB is installed (optional - can use Atlas)
mongod --version
```

---

## 🚀 Step 1: Start MongoDB (Choose One)

### Option A: Local MongoDB

```powershell
# Windows CMD (Run as Administrator)
mongod

# Expected output:
# [initandlisten] waiting for connections on port 27017
```

### Option B: MongoDB Atlas (Cloud)

```powershell
# Update backend/.env with your Atlas connection string
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/edutalk

# No command needed - cloud database is always running
```

---

## 🏃 Step 2: Terminal 1 - Start Backend

```powershell
# Navigate to backend
cd C:\Users\abdul\Desktop\class\backend

# Install dependencies (if not done)
npm install

# Start backend server with hot-reload
npm run dev

# Expected output:
# ✓ MongoDB Connected: localhost
# ✓ Server running on port 5001
# ✓ Socket.io initialized
```

---

## 🏃 Step 3: Terminal 2 - Start Frontend

```powershell
# Open NEW PowerShell terminal
# Navigate to frontend
cd C:\Users\abdul\Desktop\class\frontend

# Install dependencies (if not done)
npm install

# Start frontend dev server
npm run dev

# Expected output:
# ✓ VITE v5.x.x
# ✓ Local: http://localhost:5173/
```

---

## 🌐 Step 4: Access Applications

### Open in Browser

```
Frontend:  http://localhost:5173
Backend:   http://localhost:5001 (API only)
```

---

## 🧪 Step 5: Terminal 3 - Run Tests

```powershell
# Open NEW PowerShell terminal
# Navigate to project root
cd C:\Users\abdul\Desktop\class

# Run authentication test script
.\test_phase1_auth.ps1

# Expected output:
# ✓ User registered successfully
# ✓ Login successful
# ✓ Profile retrieved
# ✓ All tests passed!
```

---

## 📝 Step 6: Test Manually (Optional)

### In Browser UI (http://localhost:5173)

```
1. Click "Sign Up"
2. Enter:
   - Email: testuser@example.com
   - Password: Test@123456
   - Name: John Doe
3. Click "Register"
4. You should be logged in and see dashboard
5. Click profile → edit → update bio → save
6. Click "Become a Host" to upgrade
7. Verify you're now a host
8. Click "Logout"
9. Click "Log In"
10. Login again with your email/password
```

### Via API (PowerShell)

```powershell
# Register
$body = @{email="api@example.com"; password="Test@123456"; firstName="API"; lastName="User"} | ConvertTo-Json
curl -X POST "http://localhost:5001/api/auth/register" -H "Content-Type: application/json" -d $body

# Login
$body = @{email="api@example.com"; password="Test@123456"} | ConvertTo-Json
curl -X POST "http://localhost:5001/api/auth/login" -H "Content-Type: application/json" -d $body

# Get Profile (replace TOKEN with actual JWT)
curl -X GET "http://localhost:5001/api/auth/profile" -H "Authorization: Bearer TOKEN"
```

---

## 🐛 Troubleshooting

### Backend won't start

```powershell
# Check MongoDB is running
Get-Process mongod

# If not found, start MongoDB:
mongod

# Check backend/.env has MONGODB_URI set
cat backend\.env | Select-String MONGODB_URI

# Try deleting node_modules and reinstalling
rm -r backend\node_modules
npm install
```

### Frontend shows blank page

```powershell
# Check browser console (F12) for errors
# Check backend is running:
curl http://localhost:5001/

# Delete frontend cache and rebuild
rm -r frontend\node_modules
npm install
npm run dev
```

### Tests fail

```powershell
# Run individual API tests from PHASE1_WEEK1_GUIDE.md
# Check backend is running on correct port (5001)
# Check frontend is running on correct port (5173)
# Check MongoDB is connected
```

---

## 📊 Verification Checklist

After running all commands:

- [ ] Backend started successfully (see "Server running on port 5001")
- [ ] Frontend started successfully (see "Local: http://localhost:5173")
- [ ] Can access http://localhost:5173 in browser
- [ ] Test script runs without errors
- [ ] Can register new user via browser
- [ ] Can login with registered credentials
- [ ] Can view and edit profile
- [ ] Can upgrade to host role
- [ ] Can logout and login again

---

## 🎯 What to Do Next

### If All Tests Pass ✓

Proceed to **Week 1 Testing & Verification:**
1. Read PHASE1_WEEK1_GUIDE.md
2. Follow daily tasks for Days 1-5
3. Test edge cases and error scenarios
4. Move to Week 2 when complete

### If Tests Fail ✗

1. Check error messages in PHASE1_WEEK1_GUIDE.md "Common Issues" section
2. Check backend logs: `cat backend.log`
3. Check browser console (F12)
4. Run individual tests from testing guide
5. Debug step by step

---

## 💡 Quick Commands Reference

```powershell
# Stop backend (Ctrl+C in terminal 1)
# Stop frontend (Ctrl+C in terminal 2)
# Stop MongoDB (Ctrl+C in MongoDB terminal)

# View backend logs
tail -f backend.log  # or: Get-Content -Tail 20 -Wait backend.log

# View all registered users in MongoDB
mongosh
db.users.find()

# Clear all test data
db.users.deleteMany({})

# Check if ports are in use
Get-NetTcpConnection -LocalPort 5001  # Backend
Get-NetTcpConnection -LocalPort 5173  # Frontend
Get-NetTcpConnection -LocalPort 27017 # MongoDB
```

---

## 📚 Documentation

| Document | Purpose | Read Time |
|----------|---------|-----------|
| PHASE1_STATUS_REPORT.md | Overview & progress | 10 min |
| PHASE1_WEEK1_GUIDE.md | Week 1 detailed guide | 20 min |
| PHASE1_IMPLEMENTATION_ROADMAP.md | Full 6-week plan | 30 min |
| EDUTALK_COMPLETE_SPECIFICATION.md | Platform spec | 40 min |
| PHASE1_QUICK_REFERENCE.md | Quick answers | 5 min |

---

## 🎓 Learning Path

1. **First Time?** Start with: PHASE1_QUICK_REFERENCE.md (5 min)
2. **Want Details?** Read: PHASE1_WEEK1_GUIDE.md (20 min)
3. **Building Code?** Use: PHASE1_IMPLEMENTATION_ROADMAP.md (30 min)
4. **Questions?** Check: EDUTALK_COMPLETE_SPECIFICATION.md (40 min)

---

## 🚀 Full Setup Script (All in One)

Save this as `start-dev.ps1` for convenience:

```powershell
# ============================================================
# Phase 1 MVP Development - Start All Servers
# ============================================================

# Colors
$Success = [System.ConsoleColor]::Green
$Info = [System.ConsoleColor]::Cyan

Write-Host "Starting Phase 1 MVP Development Servers..." -ForegroundColor $Info
Write-Host ""

# Check MongoDB
Write-Host "Checking MongoDB..." -ForegroundColor $Info
$mongod = Get-Process mongod -ErrorAction SilentlyContinue
if (-not $mongod) {
    Write-Host "Starting MongoDB..." -ForegroundColor $Info
    Start-Process mongod -WindowStyle Minimized
    Start-Sleep -Seconds 3
}

# Start Backend
Write-Host "Starting Backend (Terminal 1)..." -ForegroundColor $Info
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\abdul\Desktop\class\backend; npm run dev"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend (Terminal 2)..." -ForegroundColor $Info
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd C:\Users\abdul\Desktop\class\frontend; npm run dev"

Write-Host ""
Write-Host "✓ All servers started!" -ForegroundColor $Success
Write-Host ""
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor $Success
Write-Host "Backend:   http://localhost:5001" -ForegroundColor $Success
Write-Host "MongoDB:   mongodb://localhost:27017/edutalk" -ForegroundColor $Success
Write-Host ""
Write-Host "Next: Open http://localhost:5173 in your browser" -ForegroundColor $Info
```

Run with:
```powershell
.\start-dev.ps1
```

---

## 🎉 You're Ready!

All systems are ready for Phase 1 MVP development.

**Current Status:**
- ✅ Code is written and tested
- ✅ Infrastructure is set up
- ✅ Documentation is complete
- ✅ Tests are ready to run

**Next:** Execute the commands above and begin testing!

---

**Need Help?** Check PHASE1_WEEK1_GUIDE.md section "Common Issues & Solutions"

