# ✅ Quick Testing Checklist - EduTalk Platform

## 🚀 Phase 1: Environment Setup (5 minutes)

- [ ] **MongoDB Running**

  ```bash
  mongod
  ```

  Should show "waiting for connections on port 27017"

- [ ] **Backend Running**

  ```bash
  cd backend
  npm run dev
  ```

  Should show server listening on port 5000

- [ ] **Frontend Running**

  ```bash
  cd frontend
  npm run dev
  ```

  Should show Vite server ready on localhost:5173

- [ ] **Create Admin Accounts**
  ```bash
  cd class
  node setup-multi-admin.js --create
  ```
  Should output 4 admin accounts created

---

## 🔐 Phase 2: Admin Setup Verification (5 minutes)

### Check MongoDB

```bash
mongosh
use edutalk
db.users.find({ isAdmin: true }).pretty()
```

**Expected:**

- [ ] 4 admin users exist
- [ ] superadmin@edutalk.com with isSuperAdmin: true
- [ ] Other 3 admins with isAdmin: true, isSuperAdmin: false
- [ ] Each has adminRole field set

### Verify Admin Credentials

- [ ] superadmin@edutalk.com → SuperAdmin123!
- [ ] admin@edutalk.com → AdminPassword123!
- [ ] support@edutalk.com → Support123!
- [ ] moderator@edutalk.com → Moderator123!

---

## 🧪 Phase 3: Backend API Tests (15 minutes)

### Authentication API

**Test Admin Login:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@edutalk.com",
    "password": "AdminPassword123!"
  }'
```

- [ ] Returns status 200
- [ ] Response includes JWT token
- [ ] Token starts with "eyJ"
- [ ] Response includes user object
- [ ] User has isAdmin: true

**Save Token:**

```bash
# Copy the token from above and set as variable
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Admin Dashboard API

**Get Dashboard Stats:**

```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Returns status 200
- [ ] Response includes:
  - [ ] totalUsers (number)
  - [ ] totalHosts (number)
  - [ ] totalClasses (number)
  - [ ] totalRevenue (number)
  - [ ] activeSubscriptions (number)

### Admin Users API

**Get Users List:**

```bash
curl -X GET http://localhost:5000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Returns status 200
- [ ] Response is array of users
- [ ] Each user has: email, firstName, lastName, isAdmin, etc.

### Admin Logs API

**Get Audit Logs:**

```bash
curl -X GET http://localhost:5000/api/admin/logs \
  -H "Authorization: Bearer $TOKEN"
```

- [ ] Returns status 200
- [ ] Response includes array of log entries
- [ ] Each log has: action, admin, timestamp, etc.

---

## 🖥️ Phase 4: Frontend UI Tests (15 minutes)

### Admin Login Page

1. Open browser: `http://localhost:5173/admin/login`
   - [ ] Page loads
   - [ ] Email field exists
   - [ ] Password field exists
   - [ ] Login button visible
   - [ ] No console errors (check F12)

2. Login with: admin@edutalk.com / AdminPassword123!
   - [ ] Click login button
   - [ ] Page redirects to admin dashboard
   - [ ] No "invalid credentials" error

### Admin Dashboard

1. Check dashboard page: `http://localhost:5173/admin/dashboard`
   - [ ] Page loads
   - [ ] Shows KPI cards with numbers
   - [ ] Sidebar menu visible
   - [ ] No loading spinner
   - [ ] No console errors

2. Verify KPI data matches API:
   - [ ] Total Users matches API response
   - [ ] Total Hosts matches API
   - [ ] Total Revenue matches API

### Admin Users Page

1. Go to: `http://localhost:5173/admin/users`
   - [ ] Users list loads
   - [ ] Shows table with user data
   - [ ] See "Suspend" button on each user
   - [ ] See "Delete" button on each user
   - [ ] Pagination works (if many users)

2. Click on first user:
   - [ ] User details page opens
   - [ ] Shows user info
   - [ ] Shows user history
   - [ ] Can perform actions

### Admin Logs Page

1. Go to: `http://localhost:5173/admin/logs`
   - [ ] Logs load and display
   - [ ] See audit trail of admin actions
   - [ ] Logs show timestamp, admin, action
   - [ ] Can scroll through logs

### Admin Settings Page

1. Go to: `http://localhost:5173/admin/settings`
   - [ ] Settings form loads
   - [ ] Can see commission settings
   - [ ] Can edit values
   - [ ] Save button works

---

## 🔑 Phase 5: Multi-Admin Role Testing (10 minutes)

### SuperAdmin Test

1. Logout
2. Login as: superadmin@edutalk.com / SuperAdmin123!
   - [ ] Login successful
   - [ ] Dashboard loads
   - [ ] Can access all pages
   - [ ] Can perform all actions

### Moderator Test

1. Logout
2. Login as: moderator@edutalk.com / Moderator123!
   - [ ] Login successful
   - [ ] Can access dashboard
   - [ ] Menu shows limited options
   - [ ] Cannot see payments page
   - [ ] Cannot see users page

3. Try accessing users directly: `http://localhost:5173/admin/users`
   - [ ] Should get 403 or redirect
   - [ ] Should see "Access Denied" message

### Support Test

1. Logout
2. Login as: support@edutalk.com / Support123!
   - [ ] Login successful
   - [ ] Can access dashboard
   - [ ] Can see users page
   - [ ] Cannot see settings page
   - [ ] Cannot see analytics page

---

## 💳 Phase 6: Payment Flow Test (10 minutes)

### Register New Student

1. Go to: `http://localhost:5173/signup`
   - [ ] Form loads
   - [ ] Can enter email, password, name
   - [ ] Click signup

2. Check email verification
   - [ ] Should have registered successfully
   - [ ] Can now login

### Browse and Enroll

1. Login as new student
2. Go to: `http://localhost:5173/browse`
   - [ ] See list of classes
   - [ ] Can click on a class

3. View class details
   - [ ] Class info displays
   - [ ] Price shown
   - [ ] Enroll button visible

4. Click Enroll button
   - [ ] Duration selector appears
   - [ ] Select 30 days
   - [ ] Price updates
   - [ ] Checkout button appears

### Payment Processing

1. Click checkout
   - [ ] Redirects to payment page
   - [ ] Stripe form loads
   - [ ] Card field ready

2. Use Stripe test card: 4242 4242 4242 4242
   - [ ] Enter card number
   - [ ] Expiry: any future date
   - [ ] CVC: any 3 digits
   - [ ] Click Pay button

3. Check results
   - [ ] Payment successful message
   - [ ] Redirects to success page
   - [ ] Class appears in "My Classes"
   - [ ] Access code displayed

### Verify in Admin Panel

1. Login as admin
2. Go to: `http://localhost:5173/admin/payments`
   - [ ] See new payment in list
   - [ ] Payment shows student name
   - [ ] Payment shows amount
   - [ ] Status is "succeeded"

---

## 📊 Phase 7: Performance Check (5 minutes)

### Browser DevTools (F12)

**Test 1: Admin Dashboard Load**

1. Open DevTools → Network tab
2. Go to: `http://localhost:5173/admin/dashboard`
3. Check Network tab → look at "DOMContentLoaded"
   - [ ] Total time < 3 seconds
   - [ ] No failed requests (red)
   - [ ] All requests completed

**Test 2: Check for Errors**

1. Open DevTools → Console tab
2. Look for red error messages
   - [ ] No 500 errors
   - [ ] No auth errors
   - [ ] No CORS errors

**Test 3: Mobile Responsive**

1. Press F12 to open DevTools
2. Click device toggle (phone icon)
3. Select "iPhone 12"
4. Refresh page
   - [ ] Layout adapts
   - [ ] Text readable
   - [ ] Buttons clickable
   - [ ] No overflow issues

---

## 🔒 Phase 8: Security Check (5 minutes)

### JWT Token Validation

```bash
# Get token from login (from earlier)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Try with invalid token
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer invalid_token"
```

- [ ] Returns status 401

### Missing Authorization

```bash
# Don't include token
curl -X GET http://localhost:5000/api/admin/dashboard
```

- [ ] Returns status 401
- [ ] Message: "No token provided"

### Role-Based Access

```bash
# Get support token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "support@edutalk.com",
    "password": "Support123!"
  }'

# Copy the support token
SUPPORT_TOKEN="..."

# Try to delete user (support can't do this)
curl -X DELETE http://localhost:5000/api/admin/users/[userid] \
  -H "Authorization: Bearer $SUPPORT_TOKEN"
```

- [ ] Returns status 403
- [ ] Message indicates permission denied

---

## 📝 Test Results Summary

Complete this table:

| Phase | Component              | Status  | Notes |
| ----- | ---------------------- | ------- | ----- |
| 1     | MongoDB                | ✅ / ❌ |       |
| 1     | Backend Server         | ✅ / ❌ |       |
| 1     | Frontend Server        | ✅ / ❌ |       |
| 2     | Admin Accounts Created | ✅ / ❌ |       |
| 3     | Admin Login API        | ✅ / ❌ |       |
| 3     | Dashboard API          | ✅ / ❌ |       |
| 3     | Users API              | ✅ / ❌ |       |
| 4     | Admin Login UI         | ✅ / ❌ |       |
| 4     | Dashboard UI           | ✅ / ❌ |       |
| 4     | Users Page UI          | ✅ / ❌ |       |
| 5     | SuperAdmin Access      | ✅ / ❌ |       |
| 5     | Moderator Restrictions | ✅ / ❌ |       |
| 5     | Support Restrictions   | ✅ / ❌ |       |
| 6     | Student Registration   | ✅ / ❌ |       |
| 6     | Class Enrollment       | ✅ / ❌ |       |
| 6     | Payment Processing     | ✅ / ❌ |       |
| 7     | Page Load Time         | ✅ / ❌ | <3s   |
| 7     | No Console Errors      | ✅ / ❌ |       |
| 8     | JWT Validation         | ✅ / ❌ |       |
| 8     | Role-Based Access      | ✅ / ❌ |       |

---

## ✅ Final Status

**Total Tests:** 8 phases
**Passed:** ** / 20
**Failed:\*\* ** / 20
**Critical Issues:\*\* \_\_

### Overall Result

- [ ] All tests PASSED ✅
- [ ] Some tests FAILED ❌
- [ ] Need to fix before deployment

### Next Steps

1. Document any failed tests
2. Fix critical issues
3. Re-run tests
4. When all pass → Ready for deployment

---

**Testing started:** \***\*\_\_\_\_\*\***  
**Testing completed:** \***\*\_\_\_\_\*\***  
**Tester name:** \***\*\_\_\_\_\*\***  
**Status:** ✅ READY / ⏸️ IN PROGRESS / ❌ ISSUES FOUND
