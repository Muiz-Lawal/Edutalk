# Phase 6B - Validation & Testing Checklist

## 🎯 Current State

- ✅ Backend: All controllers and routes implemented
- ✅ Frontend: All pages created with API integration fixes
- ✅ Database: All models defined with proper schema
- ⏳ **Status: Ready for validation testing**

---

## 📋 Critical Tests (Run These First)

### Test 1: Backend Health Check (5 min)

```bash
# Terminal 1: Start backend (if not already running)
cd backend
npm run dev
# Should see: "Server running on port 5001"
```

**Expected Output:**

```
MongoDB connected
Server running on port 5001
```

### Test 2: Frontend Build & Start (10 min)

```bash
# Terminal 2: Start frontend (if not already running)
cd frontend
npm run build  # Verify no TypeScript errors
npm run dev
# Should see: "VITE v... ready in ... ms"
```

**Expected Output:**

```
✓ 1028 modules transformed...
VITE v4.x.x ready in XXXms

➜  Local:   http://localhost:5173/
```

### Test 3: API Endpoints (15 min)

Open http://localhost:5173 and test these in browser console (F12):

```javascript
// 1. Test Progress API - should return array or 401 (no token)
fetch("http://localhost:5001/api/progress/my-progress")
  .then((r) => r.json())
  .then((d) => console.log("Progress:", d));

// 2. Test Certificate API - should return array or 401
fetch("http://localhost:5001/api/certificates/my-certificates")
  .then((r) => r.json())
  .then((d) => console.log("Certificates:", d));

// 3. Test Achievements API - should return array or 401
fetch("http://localhost:5001/api/achievements/my-achievements")
  .then((r) => r.json())
  .then((d) => console.log("Achievements:", d));

// 4. Test Points API - should return object or 401
fetch("http://localhost:5001/api/points/my-points")
  .then((r) => r.json())
  .then((d) => console.log("Points:", d));
```

**Expected Results:**

- Status 401 (Unauthorized) = **GOOD** - API is working, just needs auth token
- Status 404 (Not Found) = **BAD** - Route not found
- Status 500 = **BAD** - Server error
- Network error = **BAD** - Server not running

---

## 🧪 Frontend Page Tests (20 min)

### Page 1: Student Progress

**Route:** http://localhost:5173/student/progress

**Checklist:**

- [ ] Page loads without errors
- [ ] No 404s in console
- [ ] No TypeScript errors
- [ ] Shows placeholder message if no enrollments
- [ ] Has proper styling/layout

### Page 2: Class Progress (Host Only)

**Route:** http://localhost:5173/host/progress/class/:classId

**Checklist:**

- [ ] Requires host role (or admin)
- [ ] Shows KPI cards (total students, completion %, avg score)
- [ ] Shows student list
- [ ] Export CSV button visible
- [ ] No console errors

### Page 3: Certificates

**Route:** http://localhost:5173/certificates

**Checklist:**

- [ ] Page loads
- [ ] Shows certificate list (empty is fine)
- [ ] Download button works (or disabled if no certs)
- [ ] Share buttons visible
- [ ] Verification link displays

### Page 4: Leaderboard

**Route:** http://localhost:5173/class/:classId/leaderboard

**Checklist:**

- [ ] Page loads
- [ ] Shows student rankings
- [ ] Sort dropdown visible
- [ ] No console errors

### Page 5: Achievements

**Route:** http://localhost:5173/achievements

**Checklist:**

- [ ] Page loads
- [ ] Shows achievement list (or empty)
- [ ] Badge icons display
- [ ] Progress bars visible

### Page 6: Host Analytics

**Route:** http://localhost:5173/host/analytics

**Checklist:**

- [ ] Page loads
- [ ] Shows KPI cards
- [ ] Chart renders (or placeholder)
- [ ] CSV export button works
- [ ] No TypeScript errors

---

## 🔧 Quick Fixes (If Tests Fail)

### Issue: API returns 404

**Solution:** Check that routes are imported in `backend/src/server.js`

```javascript
// In server.js should have:
app.use("/api/progress", progressRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/points", pointsRoutes);
```

### Issue: Frontend pages don't load

**Solution:** Check that routes are in `frontend/src/App.jsx`

```javascript
// Should have routes like:
<Route path="/student/progress" element={<StudentProgressPage />} />
<Route path="/certificates" element={<CertificateGalleryPage />} />
```

### Issue: TypeScript errors

**Solution:** Run `npm run build` to see errors, then fix in the editor

### Issue: Backend won't start

**Solution:** Check port 5001 is not in use

```bash
netstat -ano | find ":5001"
# If something is using it, kill the process or use a different port
```

---

## ✅ Success Criteria

Pass all tests if:

- ✅ Backend starts without errors
- ✅ Frontend builds without TypeScript errors
- ✅ All API endpoints return 401 (meaning they exist and auth is working)
- ✅ All pages load without console errors
- ✅ No 404s for static assets

---

## 📊 Next Steps (After Validation)

### If Tests Pass ✅

1. Create test data (mock students, enrollments, progress)
2. Test full workflows (enroll → progress → certificate)
3. Polish UI/UX
4. Move to Phase 6C (Email Notifications)

### If Tests Fail ❌

1. Check backend server logs
2. Check frontend console for errors
3. Verify all files were created correctly
4. Check database connection
5. Run `npm install` if dependency issues

---

## 🚀 Recommended Testing Order

1. **Backend Health** (5 min) - Does server start?
2. **Frontend Build** (10 min) - Does it compile?
3. **API Endpoints** (5 min) - Are routes working?
4. **Frontend Pages** (20 min) - Do pages render?
5. **Full Workflow** (15 min) - Can you enroll → see progress → get cert?

**Total Time: ~55 minutes**

---

## 📝 Testing Notes

- Tests marked ❌ can be skipped for now (feature complete, not tested)
- 401 responses are GOOD (means API exists, just needs auth token)
- Page placeholders are fine (data comes from API)
- CSS styling can be rough at this point (functionality first)

---

## 🎯 Key Files to Check If Issues Arise

**Backend:**

- `backend/src/server.js` - Check routes are imported ✅
- `backend/src/controllers/progressController.js` - Check functions exist ✅
- `backend/src/routes/progressRoutes.js` - Check routes defined ✅

**Frontend:**

- `frontend/src/App.jsx` - Check routes configured ✅
- `frontend/src/pages/*.jsx` - Check pages import api client ✅
- `frontend/src/utils/api.js` - Check axios client configured ✅

---

**Status:** Phase 6B implementation complete, validation ready  
**Next Phase:** 6C - Email Notifications (not started)  
**Estimated Full Completion:** 2 more sessions
