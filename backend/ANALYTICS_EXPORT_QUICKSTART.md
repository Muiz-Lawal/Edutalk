# Analytics Export - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
cd backend
npm install jspdf nodemailer papaparse
```

### 2. Environment Configuration (Optional - for email)

Add to `.env`:

```env
# SMTP Configuration for Email Reports
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@edutalk.com
SMTP_REPLY_TO=support@edutalk.com
```

## Files Created

```
backend/src/
├── models/
│   ├── AnalyticsExport.js      - Export history tracking
│   └── ReportSchedule.js        - Scheduled reports
├── services/
│   └── exportService.js         - Core export logic
├── controllers/
│   └── exportController.js      - API endpoints
├── routes/
│   └── exportRoutes.js          - Route definitions
└── server.js                    [UPDATED - added exportRoutes]

Documentation/
├── ANALYTICS_EXPORT_README.md           - Detailed documentation
├── ANALYTICS_EXPORT_IMPLEMENTATION.md   - Implementation details
├── ANALYTICS_EXPORT_EXAMPLES.js         - Usage examples
└── ANALYTICS_EXPORT_QUICKSTART.md       - This file
```

## Quick API Tests

### 1. Export CSV

```bash
# Basic export
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/csv?streamId=$STREAM_ID" \
  -o report.csv

# With date range
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/csv?streamId=$STREAM_ID&startDate=2024-01-01&endDate=2024-01-31" \
  -o report.csv
```

### 2. Export PDF

```bash
# Summary format
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/pdf?streamId=$STREAM_ID&format=summary" \
  -o report.pdf

# Detailed format
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/pdf?streamId=$STREAM_ID&format=detailed" \
  -o report.pdf
```

### 3. Schedule Email Report

```bash
# Daily report
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["user@example.com"],
    "frequency": "daily",
    "hour": 9
  }' \
  http://localhost:5000/api/analytics/export/email

# Weekly report (Monday at 9 AM)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["user@example.com"],
    "frequency": "weekly",
    "dayOfWeek": 1,
    "hour": 9
  }' \
  http://localhost:5000/api/analytics/export/email

# Monthly report (1st of month at 10 AM)
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["user@example.com"],
    "frequency": "monthly",
    "dayOfMonth": 1,
    "hour": 10
  }' \
  http://localhost:5000/api/analytics/export/email
```

### 4. Manage Scheduled Reports

```bash
# Get all scheduled reports
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/schedules"

# Update a schedule
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hour": 14,
    "recipients": ["newemail@example.com"]
  }' \
  http://localhost:5000/api/analytics/export/schedules/$SCHEDULE_ID

# Delete a schedule
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/export/schedules/$SCHEDULE_ID
```

## API Endpoints Summary

### Export Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics/export/csv` | Export as CSV |
| GET | `/api/analytics/export/pdf` | Export as PDF |
| POST | `/api/analytics/export/email` | Schedule email report |
| GET | `/api/analytics/export/history` | Get export history |
| GET | `/api/analytics/export/schedules` | Get scheduled reports |
| PUT | `/api/analytics/export/schedules/:id` | Update schedule |
| DELETE | `/api/analytics/export/schedules/:id` | Delete schedule |

## Key Features

### ✅ CSV Export
- 32+ data columns
- Proper CSV formatting with escaping
- Date/time support
- All metrics included

### ✅ PDF Export
- Professional report layout
- Summary format (quick overview)
- Detailed format (complete breakdown)
- Auto-pagination
- Professional styling

### ✅ Email Scheduling
- Daily, weekly, monthly delivery
- Multiple recipients
- Customizable subject line
- Optional PDF attachment
- HTML email template

### ✅ Export History
- Track all exports
- Pagination support
- Filter by stream
- Automatic cleanup (7-day expiration)

### ✅ Schedule Management
- Create, read, update, delete
- Enable/disable schedules
- Track send history
- Timezone support

## Data Included

### CSV Metrics (32 columns)
- Timestamp
- Viewer Count, Peak Viewers, Total Unique Viewers
- Average Watch Time
- Average Bitrate
- Quality Distribution (1080p, 720p, 480p, Auto)
- Chat Messages, Engagement Score
- Drop Rate, Latency, Buffering Events
- Retention (5/10/15/30/60 min)
- Browsers (Chrome, Firefox, Safari, Edge)
- OS (Windows, MacOS, Linux, iOS, Android)
- Device Types (Desktop, Tablet, Mobile)

### PDF Summary Metrics
- Peak Viewers
- Average Viewers
- Total Unique Viewers
- Average Watch Time
- Total Chat Messages
- Average Engagement Score

### PDF Detailed Metrics (Additional)
- Quality Distribution breakdown
- Average Drop Rate
- Average Latency
- Total Buffering Events

## Response Examples

### CSV Export (Success)
```
HTTP/1.1 200 OK
Content-Type: text/csv
Content-Disposition: attachment; filename="stream_analytics_...csv"
Content-Length: 5242880

Timestamp,Viewer Count,Peak Viewers,...
2024-01-14T12:00:00Z,245,389,...
```

### PDF Export (Success)
```
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="stream_analytics_...pdf"
Content-Length: 1048576

[Binary PDF content]
```

### Schedule Email (Success - 201)
```json
{
  "success": true,
  "message": "Report schedule created successfully",
  "data": {
    "scheduleId": "670a1b2c3d4e5f6g7h8i9j0k",
    "frequency": "daily",
    "nextSendAt": "2024-01-15T09:00:00Z",
    "recipients": 1,
    "isActive": true
  }
}
```

### Error (400 Bad Request)
```json
{
  "success": false,
  "message": "streamId is required"
}
```

### Error (403 Unauthorized)
```json
{
  "success": false,
  "message": "Unauthorized to export this stream data"
}
```

## Database Schema

### AnalyticsExport
```
{
  streamId: ObjectId,      // Stream being exported
  userId: ObjectId,        // Who exported
  exportType: string,      // 'csv' | 'pdf' | 'email'
  format: string,          // 'detailed' | 'summary'
  downloadUrl: string,     // URL to file
  expiresAt: Date,        // 7 days from creation
  fileSize: number,       // Bytes
  createdAt: Date,
  updatedAt: Date
}
```

### ReportSchedule
```
{
  userId: ObjectId,        // Schedule owner
  hostId: ObjectId,        // Stream host
  streamId: ObjectId,      // Associated stream
  frequency: string,       // 'daily' | 'weekly' | 'monthly'
  hour: number,           // 0-23
  minute: number,         // 0-59
  recipients: [string],   // Email addresses
  isActive: boolean,      // Enable/disable
  nextSendAt: Date,       // Next delivery time
  lastSendAt: Date        // Last delivery time
}
```

## Authorization

All endpoints require:
- **Authentication:** Valid JWT token in Authorization header
- **Authorization:** User must be stream host or admin

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Troubleshooting

### Export Returns No Data
- Verify stream has metrics data
- Check date range includes data points
- Ensure StreamMetrics collection has data

### Email Scheduling Fails
- Verify SMTP configuration in .env
- Check recipients are valid email addresses
- Ensure frequency and related fields are correct
- For weekly: dayOfWeek must be 0-6
- For monthly: dayOfMonth must be 1-31

### Unauthorized Errors
- Check JWT token is valid
- Verify token is sent in Authorization header
- Ensure you're the stream host or admin
- Check token hasn't expired

### CSV/PDF Generation Fails
- Verify jsPDF is installed: `npm list jspdf`
- Check stream has metrics data
- Ensure no special characters in stream title (PDF)

## Performance Considerations

### Large Exports
- CSV exports are streamed
- PDF generation may take time for large datasets
- Exports expire after 7 days
- Database records auto-deleted after 30 days

### Email Scheduling
- Cron job needed to trigger sends (future implementation)
- Multiple recipients processed sequentially
- Retries not implemented in MVP

## Next Steps

1. **Setup Frontend UI**
   - Create export management dashboard
   - Add schedule creation form
   - Display export history

2. **Email Scheduler Service**
   - Implement cron job for scheduled sends
   - Add retry logic
   - Track delivery status

3. **Enhanced Features**
   - Excel exports
   - Custom metric selection
   - Report templates
   - Webhook notifications

## Support

For detailed documentation, see:
- `ANALYTICS_EXPORT_README.md` - Complete API reference
- `ANALYTICS_EXPORT_EXAMPLES.js` - Code examples
- `ANALYTICS_EXPORT_IMPLEMENTATION.md` - Implementation details
