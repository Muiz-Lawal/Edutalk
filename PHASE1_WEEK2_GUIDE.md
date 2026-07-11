# 📚 Phase 1 Week 2: Class Creation & Management Guide

**Duration:** 1 week (5 working days)  
**Goal:** Enable hosts to create, manage classes and students to browse with dynamic pricing  
**Status:** Starting

---

## 🎯 Week 2 Success Criteria

✅ Class schema created with all required fields  
✅ Session schema auto-generates sessions from schedule  
✅ Host can create class with title, description, category, price, schedule  
✅ Students can browse all classes with pagination  
✅ Students can view class details with schedule and pricing  
✅ Dynamic pricing calculator works for 1-30 day ranges  
✅ Host can edit/delete their classes  
✅ Complete end-to-end flow tested  

---

## 📋 Daily Breakdown

### Day 1: Schema & Database
**Objective:** Define data models for classes and sessions

1. **Create Class Schema** (backend/src/models/Class.js)
   - `hostId` (reference to User)
   - `title`, `description`, `category`
   - `monthlyPrice`, `minStudents`, `maxStudents`
   - `schedule` (array of sessions: day, startTime, endTime)
   - `thumbnail`, `coverImage`
   - `isPaid`, `isFree`
   - `createdAt`, `updatedAt`
   - `status` (draft, active, archived)

   **Model Structure:**
   ```javascript
   {
     _id: ObjectId,
     hostId: ObjectId (ref User),
     title: String,
     description: String,
     category: String (e.g., "Math", "Science", "Language"),
     
     // Pricing
     monthlyPrice: Number,
     minStudents: Number,
     maxStudents: Number,
     planTier: String (starter/growth/pro/elite affects multipliers),
     
     // Schedule - recurring sessions
     schedule: [{
       dayOfWeek: 0-6 (0=Sunday),
       startTime: "HH:MM",
       endTime: "HH:MM",
       timezone: String
     }],
     
     // Media
     thumbnail: String (URL),
     coverImage: String (URL),
     
     // Status
     isPaid: Boolean,
     isFree: Boolean,
     status: "draft" | "active" | "archived",
     enrolledStudents: Number,
     totalSessions: Number,
     
     // Analytics
     rating: Number (0-5),
     reviews: Number,
     engagement: Number,
     
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **Create Session Schema** (backend/src/models/Session.js)
   - Auto-generated from Class schedule
   - `classId`, `date`, `startTime`, `endTime`
   - `recordingUrl`, `attendees`
   - Status tracking

   **Model Structure:**
   ```javascript
   {
     _id: ObjectId,
     classId: ObjectId (ref Class),
     date: Date,
     startTime: String ("HH:MM"),
     endTime: String ("HH:MM"),
     status: "scheduled" | "live" | "completed",
     
     // Recording
     recordingUrl: String,
     recordingDuration: Number,
     hasRecording: Boolean,
     
     // Attendees
     attendees: [ObjectId],
     attendeeCount: Number,
     
     // Video
     videoKey: String (for WebRTC room),
     
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **Create Session Generator Utility** (backend/src/utils/sessionGenerator.js)
   - Function: generateSessionsForClass(classDoc, numberOfWeeks)
   - Takes schedule array and creates actual Session documents
   - Auto-generates sessions for next 8 weeks when class is created

**Testing Checklist:**
- [ ] Class model saves/loads correctly
- [ ] Session model saves/loads correctly
- [ ] Session generator creates correct dates
- [ ] Schedule times are preserved correctly
- [ ] MongoDB indexes created for fast queries

---

### Day 2: Backend APIs - Part 1
**Objective:** Implement class creation and retrieval endpoints

1. **Create classController.js** with endpoints:
   ```javascript
   export const createClass = async (req, res) => {
     // POST /api/classes
     // Body: { title, description, category, monthlyPrice, schedule }
     // Auth: Only authenticated hosts
     // Returns: Created class + 8 weeks of sessions
   }
   
   export const getClasses = async (req, res) => {
     // GET /api/classes?category=...&page=1&limit=10
     // Query: category filter, pagination
     // Returns: Array of classes + total count
   }
   
   export const getClassById = async (req, res) => {
     // GET /api/classes/:classId
     // Returns: Class details + schedule + pricing
   }
   
   export const getHostClasses = async (req, res) => {
     // GET /api/classes/host/my-classes
     // Auth: Host only
     // Returns: All classes created by this host
   }
   ```

2. **Pricing Calculation Service** (backend/src/utils/pricing.js)
   ```javascript
   export const calculateDailyPrice = (monthlyPrice, daysRequired) => {
     // Apply multiplier based on daysRequired
     // 1-3 days: 1.8x
     // 4-6 days: 1.5x
     // 7-13 days: 1.25x
     // 14-20 days: 1.1x
     // 21-30 days: 1.0x
     // Return: dailyPrice, totalPrice
   }
   
   export const calculateContinuationPrice = (monthlyPrice, alreadyPaid, additionalDays) => {
     // Calculate if buying more days is cheaper than starting fresh
   }
   ```

3. **Error Handling Middleware** (backend/src/middleware/errorHandler.js)
   - Validate required fields
   - Check host authorization
   - Return consistent error format

**API Endpoints Created:**
- `POST   /api/classes` - Create
- `GET    /api/classes` - Browse with filters
- `GET    /api/classes/:id` - View details
- `GET    /api/classes/host/my-classes` - Host dashboard
- `PUT    /api/classes/:id` - Edit (host only)
- `DELETE /api/classes/:id` - Delete (host only)

**Testing Checklist:**
- [ ] Can create class as host
- [ ] Cannot create class as student (401)
- [ ] Browse endpoint returns paginated results
- [ ] Category filter works
- [ ] Pricing calculation returns correct values
- [ ] Sessions auto-generated for 8 weeks
- [ ] Non-host cannot edit classes

---

### Day 3: Backend APIs - Part 2 & Frontend Setup
**Objective:** Complete backend APIs and prepare frontend

1. **Update classController.js** - Add remaining endpoints:
   ```javascript
   export const updateClass = async (req, res) => {
     // PUT /api/classes/:id
     // Can update: title, description, category, monthlyPrice, schedule
   }
   
   export const deleteClass = async (req, res) => {
     // DELETE /api/classes/:id
     // Also delete related sessions and subscriptions
   }
   
   export const getClassSchedule = async (req, res) => {
     // GET /api/classes/:id/schedule
     // Returns upcoming sessions with pricing for each duration
   }
   ```

2. **Create API client functions** (frontend/src/utils/api.js)
   - Add: createClass, getClasses, getClassById, updateClass, deleteClass
   - Add: calculatePrice (calls backend pricing endpoint)

3. **Create context/ClassContext.jsx**
   - State: { classes, selectedClass, loading, error }
   - Methods: fetchClasses, fetchClassById, createClass, deleteClass

4. **Create folder structure:**
   ```
   frontend/src/
   ├── pages/
   │   ├── ClassBrowsePage.jsx (student view)
   │   └── ClassDetailPage.jsx (student view)
   ├── components/
   │   ├── ClassCard.jsx
   │   ├── ClassForm.jsx (host create/edit)
   │   ├── PricingCalculator.jsx
   │   ├── ScheduleBuilder.jsx
   │   └── EnrollmentCard.jsx
   └── styles/
       ├── ClassBrowse.css
       ├── ClassDetail.css
       └── ClassForm.css
   ```

**Testing Checklist:**
- [ ] API client functions import without errors
- [ ] ClassContext initializes correctly
- [ ] Folder structure created

---

### Day 4: Frontend Implementation
**Objective:** Build UI components for class browsing and creation

1. **ClassCard Component** (frontend/src/components/ClassCard.jsx)
   - Display: thumbnail, title, category, instructor name, rating
   - Interactive: Click to view details, hover effects
   - Shows enrollment status (if student is already enrolled)

2. **ClassBrowsePage Component** (frontend/src/pages/ClassBrowsePage.jsx)
   - List all classes in grid layout
   - Filters: Category dropdown
   - Search: Title/description search
   - Pagination: 12 classes per page
   - Responsive: Mobile-friendly

3. **ClassDetailPage Component** (frontend/src/pages/ClassDetailPage.jsx)
   - Full class information
   - Schedule display (formatted)
   - Pricing breakdown table (1-30 days with calculated prices)
   - Enrollment button → redirects to payment (placeholder for now)
   - Reviews/ratings section

4. **ScheduleBuilder Component** (frontend/src/components/ScheduleBuilder.jsx)
   - For host to create class schedule
   - Select day of week, start time, end time
   - Add/remove sessions
   - Visual calendar preview

5. **ClassForm Component** (frontend/src/components/ClassForm.jsx)
   - Form for host to create/edit class
   - Fields: title, description, category, monthlyPrice, schedule
   - Image upload (placeholder for now)
   - Submit validation

6. **PricingCalculator Component** (frontend/src/components/PricingCalculator.jsx)
   - Slider: 1-30 days
   - Display: Daily rate, total price
   - Shows multiplier being applied
   - Updates in real-time

**UI Checklist:**
- [ ] ClassCard displays correctly
- [ ] Browse page shows classes in grid
- [ ] Detail page has all info
- [ ] Pricing calculator works live
- [ ] Schedule builder is intuitive
- [ ] All components are styled

---

### Day 5: Testing & Deployment Prep
**Objective:** Verify complete flow end-to-end

1. **Manual Testing Flow:**
   ```
   Host creates class:
     1. Go to Host Dashboard
     2. Click "Create Class"
     3. Fill form (title, description, monthlyPrice)
     4. Set schedule (e.g., Mon/Wed 6PM-7PM)
     5. Submit
     ✓ Class appears in dashboard
     ✓ 8 weeks of sessions created in DB
     
   Student browses and views:
     1. Go to Browse Classes
     2. See class list
     3. Click on class
     4. View details + schedule
     5. Adjust pricing slider (1-30 days)
     ✓ Price updates correctly
     ✓ All info displays
   ```

2. **Database Verification:**
   ```
   Check MongoDB:
     - Class document has all fields
     - Sessions correctly generated
     - hostId references valid user
     - Indexes created for:
       * hostId (for quick host lookup)
       * category (for filtering)
       * status (for active classes only)
   ```

3. **API Testing with curl/Postman:**
   ```bash
   # Create class (as host)
   POST /api/classes
   {
     "title": "Advanced Math",
     "description": "Calculus and beyond",
     "category": "Math",
     "monthlyPrice": 150,
     "schedule": [
       { "dayOfWeek": 1, "startTime": "18:00", "endTime": "19:00" },
       { "dayOfWeek": 3, "startTime": "18:00", "endTime": "19:00" }
     ]
   }
   
   # Browse classes (as student)
   GET /api/classes?category=Math&page=1
   
   # Get class details
   GET /api/classes/:classId
   
   # Calculate pricing
   GET /api/pricing/calculate?monthlyPrice=150&days=15
   ```

4. **Update database todos:**
   ```sql
   UPDATE todos SET status = 'done' 
   WHERE id IN ('w2-class-schema', 'w2-session-schema', 'w2-class-creation-api',
                'w2-class-list-api', 'w2-class-detail-api', 'w2-pricing-engine',
                'w2-class-browse-ui', 'w2-class-detail-ui', 'w2-testing-class-flow');
   ```

5. **Commit to Git:**
   ```bash
   git add .
   git commit -m "Phase 1 Week 2: Class creation and management complete

   - Backend: Class and Session models with auto-generation
   - Backend: APIs for CRUD operations on classes
   - Backend: Dynamic pricing calculation (1.8x-1.0x multipliers)
   - Frontend: Class browsing page with filters and pagination
   - Frontend: Class detail page with schedule and pricing
   - Frontend: Host dashboard class creation form
   - Frontend: Real-time pricing calculator
   - Tested: End-to-end flow from class creation to student browsing
   - All Week 2 todos marked complete
   
   Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
   ```

**Week 2 Complete Checklist:**
- [ ] Class model implemented
- [ ] Session model implemented  
- [ ] All 6 class APIs working
- [ ] Pricing engine calculates correctly
- [ ] Browse page displays classes
- [ ] Detail page shows pricing
- [ ] Create form works for hosts
- [ ] Schedule builder functional
- [ ] All tests passing
- [ ] Committed to Git

---

## 🛠️ Implementation Details

### Class Creation Flow
```
Host submits form
  ↓
Validate: title, description, category, monthlyPrice, schedule
  ↓
Create Class document
  ↓
Generate Sessions (call sessionGenerator)
  ↓
Return class + sessions to frontend
  ↓
Update UI to show "Class Created!"
```

### Pricing Calculation
```
Student selects 15 days
  ↓
Calculate: $150/month ÷ 30 days = $5/day
  ↓
Apply multiplier: 15 days = 1.25x
  ↓
Daily rate: $5 × 1.25 = $6.25
  ↓
Total: $6.25 × 15 = $93.75
```

### Session Auto-Generation
```
Class.schedule = [
  { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" },
  { dayOfWeek: 3, startTime: "18:00", endTime: "19:00" }
]

For next 8 weeks:
  Week 1:
    - Monday 18:00: Session 1
    - Wednesday 18:00: Session 1
  Week 2:
    - Monday 18:00: Session 2
    - Wednesday 18:00: Session 2
  ... (repeat for 8 weeks)
```

---

## 📊 Database Schema Reference

### Class
```javascript
{
  _id: ObjectId,
  hostId: ObjectId,
  title: String,
  description: String,
  category: String,
  monthlyPrice: Number,
  minStudents: Number,
  maxStudents: Number,
  schedule: Array,
  thumbnail: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Session
```javascript
{
  _id: ObjectId,
  classId: ObjectId,
  date: Date,
  startTime: String,
  endTime: String,
  status: String,
  recordingUrl: String,
  attendees: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Sessions not generating
**Solution:** Check sessionGenerator.js logic for date calculation
```javascript
// Debug: Log generated dates
console.log('Schedule:', class.schedule);
console.log('Generated sessions:', sessions);
```

### Issue 2: Pricing showing NaN
**Solution:** Verify monthlyPrice is a Number in schema
```javascript
monthlyPrice: {
  type: Number,
  required: true,
  min: 0
}
```

### Issue 3: Browse page not showing classes
**Solution:** Check MongoDB query and pagination
```javascript
// Debug API response
GET /api/classes?page=1&limit=10
// Should return: { classes: [], total: X, pages: X }
```

### Issue 4: Form validation failing
**Solution:** Ensure all required fields are provided
```javascript
const required = ['title', 'description', 'category', 'monthlyPrice', 'schedule'];
if (!required.every(field => req.body[field])) {
  return res.status(400).json({ message: 'Missing required fields' });
}
```

---

## ✅ Week 2 Verification Checklist

**Backend**
- [ ] Class model created with all fields
- [ ] Session model created
- [ ] Session generator working
- [ ] POST /api/classes creates class
- [ ] GET /api/classes returns list
- [ ] GET /api/classes/:id returns details
- [ ] Pricing calculation accurate
- [ ] 8 weeks of sessions auto-generated
- [ ] Category filtering works
- [ ] Pagination working

**Frontend**
- [ ] ClassCard component renders
- [ ] ClassBrowsePage displays classes
- [ ] ClassDetailPage shows all info
- [ ] PricingCalculator updates in real-time
- [ ] ScheduleBuilder lets host create schedule
- [ ] ClassForm submits correctly
- [ ] Browse page is responsive
- [ ] Detail page is styled nicely

**Integration**
- [ ] Host can create class end-to-end
- [ ] Student can browse and view
- [ ] Pricing displays correctly for 1-30 days
- [ ] Schedule displays in human-readable format
- [ ] All dates are correct

**Testing**
- [ ] Manual flow tested
- [ ] API endpoints tested with curl
- [ ] Database data verified
- [ ] No console errors
- [ ] Mobile responsive

---

## 🎯 Next Steps (Week 3)
After Week 2 completes:
1. Create Subscription/Enrollment model
2. Implement payment processing with Stripe
3. Create enrollment API
4. Build payment page UI
5. Test payment flow end-to-end

---

## 📚 Reference Documents
- PHASE1_IMPLEMENTATION_ROADMAP.md - Overall 6-week plan
- EDUTALK_COMPLETE_SPECIFICATION.md - Pricing algorithms
- PHASE1_QUICK_START.md - Commands to start services
- test_phase1_auth.ps1 - Testing utilities

---

**Duration:** 5 days  
**Complexity:** Medium (Database design + API + Frontend components)  
**Blockers:** None identified  
**Success:** When host can create class → student can browse → pricing calculates correctly

