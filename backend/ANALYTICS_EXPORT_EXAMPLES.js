/**
 * Analytics Export API - Usage Examples and Test Cases
 * 
 * This file contains example requests and test cases for the Analytics Export functionality.
 * These examples can be used with curl, Postman, or any HTTP client.
 */

// ============================================
// 1. EXPORT TO CSV
// ============================================

/**
 * Basic CSV Export
 * GET /api/analytics/export/csv?streamId={streamId}
 * 
 * Downloads analytics data as CSV file
 */
const csvExportBasic = {
  method: 'GET',
  url: 'http://localhost:5000/api/analytics/export/csv',
  params: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k'
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

/**
 * CSV Export with Date Range
 * GET /api/analytics/export/csv?streamId={streamId}&startDate={date}&endDate={date}
 * 
 * Downloads analytics for specific date range
 */
const csvExportWithDateRange = {
  method: 'GET',
  url: 'http://localhost:5000/api/analytics/export/csv',
  params: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    format: 'detailed'
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

// ============================================
// 2. EXPORT TO PDF
// ============================================

/**
 * PDF Export - Summary Format
 * GET /api/analytics/export/pdf?streamId={streamId}&format=summary
 * 
 * Downloads analytics as professional PDF (summary only)
 */
const pdfExportSummary = {
  method: 'GET',
  url: 'http://localhost:5000/api/analytics/export/pdf',
  params: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    format: 'summary'
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

/**
 * PDF Export - Detailed Format
 * GET /api/analytics/export/pdf?streamId={streamId}&format=detailed
 * 
 * Downloads analytics as professional PDF (with detailed breakdown)
 */
const pdfExportDetailed = {
  method: 'GET',
  url: 'http://localhost:5000/api/analytics/export/pdf',
  params: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    format: 'detailed',
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

// ============================================
// 3. SCHEDULE EMAIL REPORT - DAILY
// ============================================

/**
 * Schedule Daily Email Report
 * POST /api/analytics/export/email
 * 
 * Sends report every day at specified time
 */
const scheduleEmailDaily = {
  method: 'POST',
  url: 'http://localhost:5000/api/analytics/export/email',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    recipients: ['analytics@example.com'],
    frequency: 'daily',
    hour: 9,
    minute: 0,
    timezone: 'America/New_York',
    reportType: 'summary',
    subject: 'Daily Analytics Report',
    includeAttachment: true
  }
};

// ============================================
// 4. SCHEDULE EMAIL REPORT - WEEKLY
// ============================================

/**
 * Schedule Weekly Email Report
 * POST /api/analytics/export/email
 * 
 * Sends report every Monday at 9 AM
 * dayOfWeek: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
const scheduleEmailWeekly = {
  method: 'POST',
  url: 'http://localhost:5000/api/analytics/export/email',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    recipients: ['analytics@example.com', 'manager@example.com'],
    frequency: 'weekly',
    dayOfWeek: 1,  // Monday
    hour: 9,
    minute: 0,
    timezone: 'America/New_York',
    reportType: 'detailed',
    subject: 'Weekly Analytics Report - Stream Performance',
    includeAttachment: true
  }
};

// ============================================
// 5. SCHEDULE EMAIL REPORT - MONTHLY
// ============================================

/**
 * Schedule Monthly Email Report
 * POST /api/analytics/export/email
 * 
 * Sends report on specified day of month
 */
const scheduleEmailMonthly = {
  method: 'POST',
  url: 'http://localhost:5000/api/analytics/export/email',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    recipients: ['ceo@example.com', 'finance@example.com'],
    frequency: 'monthly',
    dayOfMonth: 1,  // First of month
    hour: 10,
    minute: 30,
    timezone: 'America/New_York',
    reportType: 'detailed',
    subject: 'Monthly Analytics Report',
    includeAttachment: true
  }
};

// ============================================
// 6. GET EXPORT HISTORY
// ============================================

/**
 * Get Export History for User
 * GET /api/analytics/export/history?streamId={streamId}&limit=10&page=1
 * 
 * Lists all exports by authenticated user
 */
const getExportHistory = {
  method: 'GET',
  url: 'http://localhost:5000/api/analytics/export/history',
  params: {
    streamId: '670a1b2c3d4e5f6g7h8i9j0k',
    limit: 10,
    page: 1
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

// ============================================
// 7. GET SCHEDULED REPORTS
// ============================================

/**
 * Get Scheduled Reports for User
 * GET /api/analytics/export/schedules?limit=10&page=1
 * 
 * Lists all active email schedules for user
 */
const getScheduledReports = {
  method: 'GET',
  url: 'http://localhost:5000/api/analytics/export/schedules',
  params: {
    limit: 10,
    page: 1
  },
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

// ============================================
// 8. UPDATE SCHEDULED REPORT
// ============================================

/**
 * Update Scheduled Report
 * PUT /api/analytics/export/schedules/{scheduleId}
 * 
 * Update frequency, recipients, timing, or status
 */
const updateScheduledReport = {
  method: 'PUT',
  url: 'http://localhost:5000/api/analytics/export/schedules/670a1b2c3d4e5f6g7h8i9j0k',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: {
    frequency: 'weekly',
    dayOfWeek: 2,  // Change to Tuesday
    hour: 14,
    recipients: ['newemail@example.com'],
    reportType: 'detailed',
    isActive: true
  }
};

// ============================================
// 9. DELETE SCHEDULED REPORT
// ============================================

/**
 * Delete Scheduled Report
 * DELETE /api/analytics/export/schedules/{scheduleId}
 * 
 * Deactivates/removes scheduled report
 */
const deleteScheduledReport = {
  method: 'DELETE',
  url: 'http://localhost:5000/api/analytics/export/schedules/670a1b2c3d4e5f6g7h8i9j0k',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
};

// ============================================
// CURL EXAMPLES
// ============================================

/*
# 1. Export CSV
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/csv?streamId=$STREAM_ID" \
  -o analytics.csv

# 2. Export PDF
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/pdf?streamId=$STREAM_ID&format=detailed" \
  -o report.pdf

# 3. Schedule Daily Email Report
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["user@example.com"],
    "frequency": "daily",
    "hour": 9,
    "minute": 0
  }' \
  http://localhost:5000/api/analytics/export/email

# 4. Schedule Weekly Email Report
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["analytics@example.com"],
    "frequency": "weekly",
    "dayOfWeek": 1,
    "hour": 9
  }' \
  http://localhost:5000/api/analytics/export/email

# 5. Schedule Monthly Email Report
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "'$STREAM_ID'",
    "recipients": ["ceo@example.com"],
    "frequency": "monthly",
    "dayOfMonth": 1,
    "hour": 10
  }' \
  http://localhost:5000/api/analytics/export/email

# 6. Get Export History
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/history?streamId=$STREAM_ID"

# 7. Get Scheduled Reports
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/analytics/export/schedules"

# 8. Update Schedule
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hour": 14,
    "recipients": ["new@example.com"]
  }' \
  http://localhost:5000/api/analytics/export/schedules/$SCHEDULE_ID

# 9. Delete Schedule
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/analytics/export/schedules/$SCHEDULE_ID
*/

// ============================================
// JAVASCRIPT FETCH EXAMPLES
// ============================================

/**
 * Export CSV using JavaScript Fetch
 */
async function exportAnalyticsCSV(streamId, token) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/analytics/export/csv?streamId=${streamId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${Date.now()}.csv`;
    link.click();

    console.log('CSV export downloaded successfully');
  } catch (error) {
    console.error('CSV export error:', error);
  }
}

/**
 * Export PDF using JavaScript Fetch
 */
async function exportAnalyticsPDF(streamId, format, token) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/analytics/export/pdf?streamId=${streamId}&format=${format}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${Date.now()}.pdf`;
    link.click();

    console.log('PDF export downloaded successfully');
  } catch (error) {
    console.error('PDF export error:', error);
  }
}

/**
 * Schedule Email Report using JavaScript Fetch
 */
async function scheduleEmailReport(scheduleData, token) {
  try {
    const response = await fetch(
      'http://localhost:5000/api/analytics/export/email',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(scheduleData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Schedule created:', result.data);
    return result.data;
  } catch (error) {
    console.error('Schedule error:', error);
  }
}

/**
 * Get Scheduled Reports using JavaScript Fetch
 */
async function getScheduledReports(token) {
  try {
    const response = await fetch(
      'http://localhost:5000/api/analytics/export/schedules',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Scheduled reports:', result.data.schedules);
    return result.data;
  } catch (error) {
    console.error('Get schedules error:', error);
  }
}

/**
 * Update Scheduled Report using JavaScript Fetch
 */
async function updateSchedule(scheduleId, updateData, token) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/analytics/export/schedules/${scheduleId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Schedule updated:', result.data);
    return result.data;
  } catch (error) {
    console.error('Update schedule error:', error);
  }
}

/**
 * Delete Scheduled Report using JavaScript Fetch
 */
async function deleteSchedule(scheduleId, token) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/analytics/export/schedules/${scheduleId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    const result = await response.json();
    console.log('Schedule deleted:', result.message);
    return result;
  } catch (error) {
    console.error('Delete schedule error:', error);
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Export CSV
exportAnalyticsCSV('670a1b2c3d4e5f6g7h8i9j0k', 'YOUR_JWT_TOKEN');

// Example 2: Export PDF
exportAnalyticsPDF('670a1b2c3d4e5f6g7h8i9j0k', 'detailed', 'YOUR_JWT_TOKEN');

// Example 3: Schedule Daily Report
scheduleEmailReport({
  streamId: '670a1b2c3d4e5f6g7h8i9j0k',
  recipients: ['user@example.com'],
  frequency: 'daily',
  hour: 9,
  minute: 0
}, 'YOUR_JWT_TOKEN');

// Example 4: Schedule Weekly Report
scheduleEmailReport({
  streamId: '670a1b2c3d4e5f6g7h8i9j0k',
  recipients: ['analytics@example.com'],
  frequency: 'weekly',
  dayOfWeek: 1,
  hour: 9
}, 'YOUR_JWT_TOKEN');

// Example 5: Get Scheduled Reports
getScheduledReports('YOUR_JWT_TOKEN');

// Example 6: Update Schedule
updateSchedule('670a1b2c3d4e5f6g7h8i9j0k', {
  hour: 14,
  recipients: ['newemail@example.com']
}, 'YOUR_JWT_TOKEN');

// Example 7: Delete Schedule
deleteSchedule('670a1b2c3d4e5f6g7h8i9j0k', 'YOUR_JWT_TOKEN');
*/

export {
  exportAnalyticsCSV,
  exportAnalyticsPDF,
  scheduleEmailReport,
  getScheduledReports,
  updateSchedule,
  deleteSchedule
};
