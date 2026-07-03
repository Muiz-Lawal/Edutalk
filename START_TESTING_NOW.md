# 🧪 START TESTING NOW - Copy & Paste Commands

## Step 1: Create Admin Accounts (Copy & Paste)

```bash
cd class
node setup-multi-admin.js --create
```

**Expected Output:**

```
✅ SUPERADMIN: superadmin@edutalk.com → SuperAdmin123!
✅ ADMIN:      admin@edutalk.com       → AdminPassword123!
✅ SUPPORT:    support@edutalk.com     → Support123!
✅ MODERATOR:  moderator@edutalk.com   → Moderator123!
```

---

## Step 2: Start Services (3 Separate Terminals)

### Terminal 1 - Start MongoDB

```bash
mongod
```

### Terminal 2 - Start Backend

```bash
cd backend
npm run dev
```

### Terminal 3 - Start Frontend

```bash
cd frontend
npm run dev
```

---

## Step 3: Quick API Tests (Copy & Paste)

### Test 1: Admin Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edutalk.com",
    "password": "AdminPassword123!"
  }'
```

**Expected:** Returns JWT token (starts with "eyJ")

---

### Test 2: Get Dashboard Stats

Copy the token from Test 1 and run:

```bash
TOKEN="paste_token_here"

curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Returns JSON with stats like totalUsers, totalHosts, etc.

---

### Test 3: Get Admin Users

```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:** Returns array of users

---

## Step 4: Quick UI Tests (Browser)

### Test 1: Admin Login Page

1. Open: `http://localhost:5173/admin/login`
2. Login with: admin@edutalk.com / AdminPassword123!

**Expected:** Redirects to admin dashboard

---

### Test 2: Admin Dashboard

1. After login, you should be on: `http://localhost:5173/admin/dashboard`

**Expected:**

- Page loads
- Shows KPI cards with numbers
- No errors in console (F12)

---

### Test 3: Admin Users Page

1. Click "Users" in sidebar
2. Go to: `http://localhost:5173/admin/users`

**Expected:**

- Users list loads
- Can see user data
- Buttons visible

---

### Test 4: Role Testing - Moderator

1. Logout
2. Login as: moderator@edutalk.com / Moderator123!
3. Try to access: `http://localhost:5173/admin/users`

**Expected:**

- Cannot access (should get 403 or redirect)
- Only moderation page available

---

## Step 5: Full Testing (Comprehensive)

Use this checklist: `TESTING_CHECKLIST.md`

It has:

- ✅ 50 test cases
- ✅ All with commands
- ✅ Expected results
- ✅ Results tracking

---

## 📋 Quick Verification

### Check MongoDB

```bash
mongosh
use edutalk
db.users.find({ isAdmin: true }).pretty()
```

**Expected:** 4 admin users shown

---

### Check Backend Status

Visit: `http://localhost:5000/api/auth/login` (GET request)

**Expected:** 404 (because it's POST-only, but shows server is running)

---

### Check Frontend Status

Visit: `http://localhost:5173`

**Expected:** EduTalk homepage loads

---

## ✅ Verification Checklist

- [ ] MongoDB running
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)
- [ ] 4 admin accounts created
- [ ] Admin login successful
- [ ] Dashboard loads
- [ ] Roles enforced (moderator can't see users)
- [ ] No console errors

---

## 🚀 If Everything Works

You're ready to:

1. Deploy to production
2. Tell users about it
3. Have admins start using the platform

---

## 🐛 If Something Breaks

**Issue:** "Cannot connect to MongoDB"

```bash
# Fix: Start MongoDB
mongod
```

**Issue:** "Backend not responding"

```bash
# Fix: Make sure you're in the backend folder
cd backend
npm run dev
```

**Issue:** "Admin page shows 404"

```bash
# Fix: Make sure frontend is running
cd frontend
npm run dev
```

**Issue:** "Login says credentials invalid"

```bash
# Fix: Create admin accounts
node setup-multi-admin.js --create
```

**Issue:** "Role restrictions not working"

```bash
# Fix: Check database
mongosh
use edutalk
db.users.findOne({ email: "moderator@edutalk.com" })
# Should show: adminRole: "moderator", isAdmin: true
```

---

## 📊 Testing Time Estimate

| Task                    | Time           |
| ----------------------- | -------------- |
| Setup (Step 1-2)        | 5 min          |
| API Tests (Step 3)      | 10 min         |
| UI Tests (Step 4)       | 15 min         |
| Full Checklist (Step 5) | 60-120 min     |
| **Total**               | **90-150 min** |

---

## 🎯 Success = Everything Below Works

1. ✅ Create 4 admin accounts
2. ✅ All services start
3. ✅ Admin can login
4. ✅ Dashboard shows data
5. ✅ Different roles have different access
6. ✅ No errors in console

If all 6 are working → **YOU'RE DONE** 🎉

---

## 📝 Document Results

After testing, create `TEST_RESULTS_[DATE].md` with:

- Date tested
- Tester name
- Environment (Windows/Mac/Linux)
- Results summary
- Any issues found
- Screenshots (if issues)

---

## 🚀 You're All Set!

Everything is ready to test. Start with:

```bash
node setup-multi-admin.js --create
```

Then follow the steps above.

Good luck! 🎉
