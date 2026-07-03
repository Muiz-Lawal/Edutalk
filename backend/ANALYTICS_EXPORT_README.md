# Analytics Export Functionality - Documentation

## Overview

The Analytics Export system provides functionality to export stream analytics data in multiple formats (CSV, PDF) and schedule automated email reports. This allows users to access detailed performance metrics and share analytics with stakeholders.

## Database Models

### AnalyticsExport Model

Stores information about exported analytics files.

**Schema:**
```javascript
{
  streamId: ObjectId (ref: LiveStream),      // Stream being exported
  userId: ObjectId (ref: User),              // User who performed export
  exportType: String ('csv' | 'pdf' | 'email'),
  format: String ('detailed' | 'summary'),
  includedMetrics: [String],                 // e.g., ['viewers', 'bitrate', 'quality']
  downloadUrl: String,                       // URL to download file
  expiresAt: Date,                          // 7 days from creation
  fileSize: Number,                         // Bytes
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `streamId, createdAt` - Query exports for a stream
- `userId, createdAt` - Query user's exports
- `expiresAt` (TTL) - Auto-delete after 30 days

### ReportSchedule Model

Manages scheduled report delivery via email.

**Schema:**
```javascript
{
  userId: ObjectId (ref: User),              // Schedule owner
  hostId: ObjectId (ref: User),              // Stream host
  streamId: ObjectId (ref: LiveStream),      // Associated stream
  frequency: String ('daily' | 'weekly' | 'monthly'),
  dayOfWeek: Number (0-6),                  // For weekly (0=Sunday)
  dayOfMonth: Number (1-31),                // For monthly
  hour: Number (0-23),                      // Delivery hour
  minute: Number (0-59),                    // Delivery minute
  timezone: String,                         // e.g., 'America/New_York'
  recipients: [String],                     // Email addresses
  subject: String,                          // Email subject
  includeAttachment: Boolean,               // Include PDF attachment
  includeMetrics: [String],                 // Which metrics to include
  reportType: String ('summary' | 'detailed'),
  isActive: Boolean,                        // Enable/disable schedule
  lastSentAt: Date,                         // Last delivery time
  nextSendAt: Date (indexed),               // Next scheduled delivery
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `userId, isActive` - Query user's active schedules
- `hostId, frequency` - Query by stream host
- `nextSendAt, isActive` - Find schedules due for delivery

## API Endpoints

### 1. Export to CSV

**Endpoint:** `GET /api/analytics/export/csv`

**Query Parameters:**
- `streamId` (required) - Stream ID to export
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `format` (optional) - 'detailed' or 'summary' (default: 'detailed')

**Example Request:**
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/analytics/export/csv?streamId=670a1b2c3d4e5f6g7h8i9j0k&startDate=2024-01-01&endDate=2024-01-31"
```

**Response:**
- CSV file download with stream analytics data
- Headers include: Timestamp, Viewer Count, Peak Viewers, Bitrate, Quality Distribution, Engagement, etc.
- File size recorded in AnalyticsExport model

**Status Codes:**
- 200 - Success, CSV file returned
- 400 - Missing required streamId
- 403 - Unauthorized (not stream host or admin)
- 404 - Stream not found
- 500 - Server error

### 2. Export to PDF

**Endpoint:** `GET /api/analytics/export/pdf`

**Query Parameters:**
- `streamId` (required) - Stream ID to export
- `startDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `format` (optional) - 'summary' or 'detailed' (default: 'summary')

**Example Request:**
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/analytics/export/pdf?streamId=670a1b2c3d4e5f6g7h8i9j0k&format=detailed" \
  -o report.pdf
```

**Response:**
- PDF file download with professional report layout
- Includes header with stream info and report date
- Summary Statistics section (always included)
- System Health and Quality Distribution (if format='detailed')
- Formatted tables and metrics

**Status Codes:**
- 200 - Success, PDF file returned
- 400 - Missing required streamId
- 403 - Unauthorized
- 404 - Stream not found
- 500 - Server error

### 3. Schedule Email Report

**Endpoint:** `POST /api/analytics/export/email`

**Request Body:**
```json
{
  "streamId": "670a1b2c3d4e5f6g7h8i9j0k",
  "recipients": ["user@example.com", "admin@example.com"],
  "frequency": "weekly",
  "dayOfWeek": 2,
  "hour": 9,
  "minute": 0,
  "timezone": "America/New_York",
  "reportType": "summary",
  "subject": "Weekly Analytics Report",
  "includeAttachment": true
}
```

**Required Fields:**
- `streamId` - Stream ID
- `recipients` - Email addresses array
- `frequency` - 'daily', 'weekly', or 'monthly'
- `hour` - Delivery hour (0-23)

**Conditional Fields:**
- `dayOfWeek` (required if frequency='weekly') - 0-6 (0=Sunday)
- `dayOfMonth` (required if frequency='monthly') - 1-31

**Optional Fields:**
- `minute` - Delivery minute (default: 0)
- `timezone` - IANA timezone (default: 'America/New_York')
- `reportType` - 'summary' or 'detailed' (default: 'summary')
- `subject` - Email subject (default: 'Analytics Report')
- `includeAttachment` - Include PDF attachment (default: true)

**Example Request:**
```bash
curl -X POST -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "670a1b2c3d4e5f6g7h8i9j0k",
    "recipients": ["analytics@example.com"],
    "frequency": "daily",
    "hour": 9,
    "minute": 0
  }' \
  http://localhost:5000/api/analytics/export/email
```

**Response:**
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

**Status Codes:**
- 201 - Created successfully
- 400 - Missing required fields or invalid parameters
- 403 - Unauthorized
- 404 - Stream not found
- 500 - Server error

### 4. Get Export History

**Endpoint:** `GET /api/analytics/exports/history`

**Query Parameters:**
- `streamId` (optional) - Filter by stream
- `limit` (optional) - Items per page (default: 10)
- `page` (optional) - Page number (default: 1)

**Example Request:**
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/analytics/export/history?streamId=670a1b2c3d4e5f6g7h8i9j0k&limit=20&page=1"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exports": [
      {
        "_id": "670a1b2c3d4e5f6g7h8i9j0k",
        "streamId": "670a1b2c3d4e5f6g7h8i9j0k",
        "userId": "670a1b2c3d4e5f6g7h8i9j0k",
        "exportType": "csv",
        "format": "detailed",
        "fileSize": 5242880,
        "createdAt": "2024-01-14T15:30:00Z",
        "expiresAt": "2024-01-21T15:30:00Z"
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 10,
      "page": 1,
      "pages": 1
    }
  }
}
```

### 5. Get Scheduled Reports

**Endpoint:** `GET /api/analytics/export/schedules`

**Query Parameters:**
- `streamId` (optional) - Filter by stream
- `limit` (optional) - Items per page (default: 10)
- `page` (optional) - Page number (default: 1)

**Example Request:**
```bash
curl -H "Authorization: Bearer {token}" \
  "http://localhost:5000/api/analytics/export/schedules"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "_id": "670a1b2c3d4e5f6g7h8i9j0k",
        "streamId": "670a1b2c3d4e5f6g7h8i9j0k",
        "frequency": "daily",
        "hour": 9,
        "minute": 0,
        "recipients": ["user@example.com"],
        "reportType": "summary",
        "isActive": true,
        "nextSendAt": "2024-01-15T09:00:00Z",
        "lastSentAt": "2024-01-14T09:00:00Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "page": 1,
      "pages": 1
    }
  }
}
```

### 6. Update Scheduled Report

**Endpoint:** `PUT /api/analytics/export/schedules/:scheduleId`

**Request Body:**
```json
{
  "frequency": "weekly",
  "dayOfWeek": 1,
  "hour": 10,
  "recipients": ["new@example.com"],
  "isActive": true,
  "reportType": "detailed"
}
```

**Example Request:**
```bash
curl -X PUT -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "hour": 14,
    "recipients": ["updated@example.com"]
  }' \
  http://localhost:5000/api/analytics/export/schedules/670a1b2c3d4e5f6g7h8i9j0k
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": {
    "_id": "670a1b2c3d4e5f6g7h8i9j0k",
    "frequency": "daily",
    "hour": 14,
    "recipients": ["updated@example.com"],
    "nextSendAt": "2024-01-15T14:00:00Z"
  }
}
```

### 7. Delete Scheduled Report

**Endpoint:** `DELETE /api/analytics/export/schedules/:scheduleId`

**Example Request:**
```bash
curl -X DELETE -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/analytics/export/schedules/670a1b2c3d4e5f6g7h8i9j0k
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```

## Data Export Formats

### CSV Export

Comma-separated values format with headers:
- Timestamp (ISO 8601)
- Viewer Count
- Peak Viewers
- Total Unique Viewers
- Average Watch Time (minutes)
- Average Bitrate (kbps)
- Quality Distribution (1080p, 720p, 480p, Auto)
- Chat Messages
- Engagement Score
- System Health Metrics (Drop Rate, Latency, Buffering Events)
- Retention Data (5min, 10min, 15min, 30min, 60min)
- Demographics (Browser, OS, Device Type)

**Example:**
```
Timestamp,Viewer Count,Peak Viewers,Total Unique Viewers,...
2024-01-14T12:00:00Z,245,389,512,...
2024-01-14T12:01:00Z,248,389,512,...
```

### PDF Export

Professional report format including:
- Header with stream title and generation date
- Summary Statistics section (always)
- Quality Distribution (if detailed format)
- System Health Metrics (if detailed format)
- Footer with page numbers

**Features:**
- Professional branding
- Formatted tables
- Clear typography
- Auto-pagination

### Email Report

HTML email template with:
- Stream title and report date
- Summary metrics in cards
- Quality distribution breakdown (if detailed)
- System health indicators
- Professional footer

**Attachment Options:**
- Can include CSV or PDF attachment
- Controlled by `includeAttachment` setting

## Service Functions

### exportService.js

**Available Functions:**

1. **fetchStreamAnalytics(streamId, startDate, endDate)**
   - Retrieves raw metrics data from StreamMetrics
   - Returns array of metric documents

2. **exportToCSV(streamId, metrics, startDate, endDate)**
   - Converts analytics data to CSV format
   - Properly escapes and formats fields
   - Returns CSV string

3. **exportToPDF(streamId, metrics, format, startDate, endDate)**
   - Generates PDF report using jsPDF
   - Returns PDF as Buffer
   - Supports 'summary' and 'detailed' formats

4. **calculateSummaryStats(analyticsData)**
   - Calculates aggregate statistics from metrics array
   - Returns object with peak viewers, averages, totals

5. **generateEmailTemplate(streamInfo, summaryStats, reportType)**
   - Creates HTML email content
   - Supports summary and detailed formats
   - Returns HTML string

6. **sendEmailReport(scheduleId, recipients, subject, streamInfo, format)**
   - Sends email via Nodemailer
   - Updates lastSendAt in schedule
   - Requires SMTP configuration

7. **calculateNextSendTime(frequency, dayOfWeek, dayOfMonth, hour, minute, timezone)**
   - Calculates next scheduled delivery time
   - Handles daily, weekly, monthly frequencies
   - Returns Date object

## Configuration

### Environment Variables

Required for email functionality:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@edutalk.com
SMTP_REPLY_TO=support@edutalk.com
```

### Dependencies

```json
{
  "jspdf": "^2.5.1",
  "html2pdf.js": "^0.10.1",
  "nodemailer": "^6.9.7",
  "papaparse": "^5.4.1"
}
```

## Error Handling

### Common Errors

1. **No Analytics Data Found**
   - Ensure stream has active metrics
   - Check date range includes data points

2. **Unauthorized Export**
   - Only stream host or admin can export
   - Check user permissions

3. **Invalid Schedule Parameters**
   - Weekly requires dayOfWeek
   - Monthly requires dayOfMonth
   - Hour must be 0-23

4. **Email Send Failed**
   - Verify SMTP credentials
   - Check recipient email format
   - Ensure server has internet access

## Metrics Included

### Summary Metrics
- Peak Viewers
- Average Viewers
- Total Unique Viewers
- Average Watch Time
- Total Chat Messages
- Average Engagement Score

### Detailed Metrics (Additional)
- Quality distribution (1080p, 720p, 480p, Auto)
- Average Drop Rate
- Average Latency
- Total Buffering Events
- Browser distribution
- OS distribution
- Device type distribution
- Retention curves (5/10/15/30/60 min)

## Usage Examples

### Python Example
```python
import requests
import json

headers = {"Authorization": f"Bearer {token}"}

# Export to CSV
response = requests.get(
    "http://localhost:5000/api/analytics/export/csv",
    params={
        "streamId": "670a1b2c3d4e5f6g7h8i9j0k",
        "startDate": "2024-01-01",
        "endDate": "2024-01-31"
    },
    headers=headers
)
with open("analytics.csv", "wb") as f:
    f.write(response.content)

# Schedule email report
schedule_data = {
    "streamId": "670a1b2c3d4e5f6g7h8i9j0k",
    "recipients": ["analytics@example.com"],
    "frequency": "weekly",
    "dayOfWeek": 1,
    "hour": 9
}
response = requests.post(
    "http://localhost:5000/api/analytics/export/email",
    json=schedule_data,
    headers=headers
)
print(response.json())
```

### cURL Examples
```bash
# Export CSV
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/csv?streamId=$STREAM_ID" \
  -o report.csv

# Export PDF
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/pdf?streamId=$STREAM_ID&format=detailed" \
  -o report.pdf

# Schedule email
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["user@example.com"],
    "frequency": "daily",
    "hour": 9
  }' \
  http://localhost:5000/api/analytics/export/email

# Get schedules
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/schedules"
```

## Success Criteria Met

✅ Models created with proper schema design
✅ Export functions work for CSV and PDF
✅ CSV export generates valid format with proper escaping
✅ PDF export generates valid PDF with professional layout
✅ Email templates created and ready for sending
✅ No external API calls needed for MVP
✅ Error handling for edge cases (no data, unauthorized access, invalid parameters)
✅ Comprehensive API endpoints with proper authorization
✅ Database indexes for efficient querying
✅ TTL indexes for automatic data cleanup

## Future Enhancements

1. **Export Scheduling Service**
   - Create cron job to trigger scheduled email sends
   - Track sent status and retry failed sends

2. **Analytics Dashboard**
   - Frontend UI for export management
   - Schedule creation and management interface

3. **Enhanced Formats**
   - Excel exports with multiple sheets
   - JSON exports for API consumers

4. **Performance Optimization**
   - Stream large exports instead of loading in memory
   - Implement pagination for large datasets

5. **Additional Metrics**
   - Cohort analysis
   - Predictive analytics
   - Custom metric selection

6. **Notification Improvements**
   - SMS notifications
   - Slack integration
   - Webhook notifications
