import mongoose from 'mongoose';
import StreamMetrics from '../models/StreamMetrics.js';
import LiveStream from '../models/LiveStream.js';
import AnalyticsExport from '../models/AnalyticsExport.js';
import ReportSchedule from '../models/ReportSchedule.js';

/**
 * Export Service - Handles analytics data export to various formats
 */

/**
 * Fetch analytics data for a stream
 */
const fetchStreamAnalytics = async (streamId, startDate = null, endDate = null) => {
  try {
    const query = { liveStreamId: new mongoose.Types.ObjectId(streamId) };

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const metrics = await StreamMetrics.find(query)
      .sort({ timestamp: 1 })
      .lean();

    return metrics;
  } catch (error) {
    console.error('Error fetching stream analytics:', error);
    throw error;
  }
};

/**
 * Format metrics data to CSV string
 */
const exportToCSV = async (streamId, metrics = null, startDate = null, endDate = null) => {
  try {
    const analyticsData = metrics || (await fetchStreamAnalytics(streamId, startDate, endDate));

    if (analyticsData.length === 0) {
      throw new Error('No analytics data found for this stream');
    }

    // Define CSV headers
    const headers = [
      'Timestamp',
      'Viewer Count',
      'Peak Viewers',
      'Total Unique Viewers',
      'Average Watch Time (mins)',
      'Average Bitrate (kbps)',
      'Quality 1080p',
      'Quality 720p',
      'Quality 480p',
      'Quality Auto',
      'Chat Messages',
      'Engagement Score (%)',
      'Drop Rate (%)',
      'Average Latency (ms)',
      'Buffering Events',
      'Retention 5min',
      'Retention 10min',
      'Retention 15min',
      'Retention 30min',
      'Retention 60min',
      'Chrome',
      'Firefox',
      'Safari',
      'Edge',
      'Windows',
      'MacOS',
      'Linux',
      'iOS',
      'Android',
      'Desktop',
      'Tablet',
      'Mobile',
    ];

    // Convert data to CSV rows
    const rows = analyticsData.map((data) => [
      new Date(data.timestamp).toISOString(),
      data.viewerCount || 0,
      data.peakViewerCount || 0,
      data.totalUniqueViewers || 0,
      (data.averageWatchTime / 60).toFixed(2) || 0,
      data.averageBitrate || 0,
      data.qualityDistribution?.['1080p'] || 0,
      data.qualityDistribution?.['720p'] || 0,
      data.qualityDistribution?.['480p'] || 0,
      data.qualityDistribution?.auto || 0,
      data.chatMessages || 0,
      data.averageEngagementScore || 0,
      data.dropRate || 0,
      data.averageLatency || 0,
      data.bufferingEvents || 0,
      data.viewersAt?.['5min'] || 0,
      data.viewersAt?.['10min'] || 0,
      data.viewersAt?.['15min'] || 0,
      data.viewersAt?.['30min'] || 0,
      data.viewersAt?.['60min'] || 0,
      data.browsers?.Chrome || 0,
      data.browsers?.Firefox || 0,
      data.browsers?.Safari || 0,
      data.browsers?.Edge || 0,
      data.operatingSystems?.Windows || 0,
      data.operatingSystems?.MacOS || 0,
      data.operatingSystems?.Linux || 0,
      data.operatingSystems?.iOS || 0,
      data.operatingSystems?.Android || 0,
      data.deviceTypes?.Desktop || 0,
      data.deviceTypes?.Tablet || 0,
      data.deviceTypes?.Mobile || 0,
    ]);

    // Create CSV string
    let csv = headers.join(',') + '\n';
    rows.forEach((row) => {
      const escapedRow = row.map((field) => {
        const strField = String(field);
        if (strField.includes(',') || strField.includes('"') || strField.includes('\n')) {
          return `"${strField.replace(/"/g, '""')}"`;
        }
        return strField;
      });
      csv += escapedRow.join(',') + '\n';
    });

    return csv;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw error;
  }
};

/**
 * Generate PDF report from analytics data
 */
const exportToPDF = async (streamId, metrics = null, format = 'detailed', startDate = null, endDate = null) => {
  try {
    const jsPDF = (await import('jspdf')).jsPDF;

    const analyticsData = metrics || (await fetchStreamAnalytics(streamId, startDate, endDate));

    if (analyticsData.length === 0) {
      throw new Error('No analytics data found for this stream');
    }

    const stream = await LiveStream.findById(streamId).select('title hostId').lean();
    const summary = calculateSummaryStats(analyticsData);

    const doc = new jsPDF();
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Header
    doc.setFontSize(16);
    doc.text('Stream Analytics Report', margin, yPosition);
    yPosition += 10;

    // Stream info
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Stream: ${stream?.title || 'Unknown'}`, margin, yPosition);
    yPosition += 5;
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    if (startDate || endDate) {
      yPosition += 5;
      const dateRange = `${startDate ? new Date(startDate).toLocaleDateString() : 'Start'} to ${endDate ? new Date(endDate).toLocaleDateString() : 'End'}`;
      doc.text(`Period: ${dateRange}`, margin, yPosition);
    }
    yPosition += 10;

    // Summary section
    if (format === 'summary' || format === 'detailed') {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary Statistics', margin, yPosition);
      yPosition += 7;

      const summaryLines = [
        `Peak Viewers: ${summary.peakViewers}`,
        `Average Viewers: ${summary.avgViewers.toFixed(0)}`,
        `Total Unique Viewers: ${summary.totalUniqueViewers}`,
        `Average Watch Time: ${(summary.avgWatchTime / 60).toFixed(2)} minutes`,
        `Total Chat Messages: ${summary.totalChatMessages}`,
        `Average Engagement Score: ${summary.avgEngagement.toFixed(1)}%`,
      ];

      doc.setFontSize(10);
      summaryLines.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
    }

    yPosition += 5;

    // Detailed section
    if (format === 'detailed') {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text('Quality Distribution', margin, yPosition);
      yPosition += 7;

      const qualityLines = [
        `1080p: ${summary.quality['1080p']} viewers`,
        `720p: ${summary.quality['720p']} viewers`,
        `480p: ${summary.quality['480p']} viewers`,
        `Auto: ${summary.quality.auto} viewers`,
      ];

      doc.setFontSize(10);
      qualityLines.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });

      yPosition += 5;

      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text('System Health Metrics', margin, yPosition);
      yPosition += 7;

      const healthLines = [
        `Average Drop Rate: ${summary.avgDropRate.toFixed(2)}%`,
        `Average Latency: ${summary.avgLatency.toFixed(2)} ms`,
        `Total Buffering Events: ${summary.totalBufferingEvents}`,
      ];

      doc.setFontSize(10);
      healthLines.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin + 5, yPosition);
        yPosition += 5;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 10, {
      align: 'center',
    });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Calculate summary statistics from metrics
 */
const calculateSummaryStats = (analyticsData) => {
  let totalViewers = 0;
  let peakViewers = 0;
  let maxUniqueViewers = 0;
  let totalWatchTime = 0;
  let totalChatMessages = 0;
  let totalEngagementScore = 0;
  let totalDropRate = 0;
  let totalLatency = 0;
  let totalBufferingEvents = 0;

  const qualityStats = {
    '1080p': 0,
    '720p': 0,
    '480p': 0,
    auto: 0,
  };

  analyticsData.forEach((data) => {
    totalViewers += data.viewerCount || 0;
    peakViewers = Math.max(peakViewers, data.peakViewerCount || 0);
    maxUniqueViewers = Math.max(maxUniqueViewers, data.totalUniqueViewers || 0);
    totalWatchTime += data.averageWatchTime || 0;
    totalChatMessages += data.chatMessages || 0;
    totalEngagementScore += data.averageEngagementScore || 0;
    totalDropRate += data.dropRate || 0;
    totalLatency += data.averageLatency || 0;
    totalBufferingEvents += data.bufferingEvents || 0;

    qualityStats['1080p'] += data.qualityDistribution?.['1080p'] || 0;
    qualityStats['720p'] += data.qualityDistribution?.['720p'] || 0;
    qualityStats['480p'] += data.qualityDistribution?.['480p'] || 0;
    qualityStats.auto += data.qualityDistribution?.auto || 0;
  });

  const count = analyticsData.length;

  return {
    peakViewers,
    avgViewers: totalViewers / count,
    totalUniqueViewers: maxUniqueViewers,
    avgWatchTime: totalWatchTime / count,
    totalChatMessages,
    avgEngagement: totalEngagementScore / count,
    avgDropRate: totalDropRate / count,
    avgLatency: totalLatency / count,
    totalBufferingEvents,
    quality: qualityStats,
  };
};

/**
 * Generate HTML email template
 */
const generateEmailTemplate = (streamInfo, summaryStats, reportType = 'summary') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; border-radius: 5px; text-align: center; }
            .section { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4CAF50; }
            .section h3 { margin-top: 0; color: #4CAF50; }
            .metric { display: inline-block; width: 45%; margin: 10px 2.5%; }
            .metric-value { font-size: 24px; font-weight: bold; color: #4CAF50; }
            .metric-label { color: #666; font-size: 12px; }
            .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Stream Analytics Report</h2>
                <p>for ${streamInfo?.title || 'Your Stream'}</p>
            </div>
            <div class="section">
                <h3>Summary Statistics</h3>
                <div class="metric"><div class="metric-value">${summaryStats.peakViewers}</div><div class="metric-label">Peak Viewers</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.avgViewers.toFixed(0)}</div><div class="metric-label">Average Viewers</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.totalUniqueViewers}</div><div class="metric-label">Total Unique Viewers</div></div>
                <div class="metric"><div class="metric-value">${(summaryStats.avgWatchTime / 60).toFixed(2)}</div><div class="metric-label">Average Watch Time (min)</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.totalChatMessages}</div><div class="metric-label">Chat Messages</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.avgEngagement.toFixed(1)}%</div><div class="metric-label">Avg Engagement</div></div>
            </div>
            ${reportType === 'detailed' ? `
            <div class="section">
                <h3>Quality Distribution</h3>
                <div class="metric"><div class="metric-value">${summaryStats.quality['1080p']}</div><div class="metric-label">1080p Viewers</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.quality['720p']}</div><div class="metric-label">720p Viewers</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.quality['480p']}</div><div class="metric-label">480p Viewers</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.quality.auto}</div><div class="metric-label">Auto Quality</div></div>
            </div>
            <div class="section">
                <h3>System Health</h3>
                <div class="metric"><div class="metric-value">${summaryStats.avgDropRate.toFixed(2)}%</div><div class="metric-label">Drop Rate</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.avgLatency.toFixed(2)}ms</div><div class="metric-label">Avg Latency</div></div>
                <div class="metric"><div class="metric-value">${summaryStats.totalBufferingEvents}</div><div class="metric-label">Buffering Events</div></div>
            </div>` : ''}
            <div class="footer">
                <p>Generated on ${new Date().toLocaleString()}</p>
                <p>&copy; 2026 EduTalk Analytics</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Send email report via Nodemailer
 */
const sendEmailReport = async (scheduleId, recipients, subject, streamInfo, format = 'summary') => {
  try {
    const nodemailer = await import('nodemailer');

    const analyticsData = await fetchStreamAnalytics(streamInfo._id);
    if (analyticsData.length === 0) {
      throw new Error('No analytics data available for report');
    }

    const summaryStats = calculateSummaryStats(analyticsData);
    const htmlContent = generateEmailTemplate(streamInfo, summaryStats, format);

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailPromises = recipients.map((recipient) =>
      transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@edutalk.com',
        to: recipient,
        subject,
        html: htmlContent,
        replyTo: process.env.SMTP_REPLY_TO,
      })
    );

    await Promise.all(emailPromises);

    await ReportSchedule.findByIdAndUpdate(
      scheduleId,
      { lastSentAt: new Date() },
      { new: true }
    );

    console.log(`Email report sent to ${recipients.length} recipients`);
    return true;
  } catch (error) {
    console.error('Error sending email report:', error);
    throw error;
  }
};

/**
 * Schedule next report send time
 */
const calculateNextSendTime = (frequency, dayOfWeek, dayOfMonth, hour, minute, timezone) => {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setHours(hour, minute, 0, 0);

  if (frequency === 'daily') {
    if (targetDate <= now) targetDate.setDate(targetDate.getDate() + 1);
  } else if (frequency === 'weekly') {
    const daysDiff = (dayOfWeek - targetDate.getDay() + 7) % 7;
    if (daysDiff === 0 && targetDate <= now) {
      targetDate.setDate(targetDate.getDate() + 7);
    } else {
      targetDate.setDate(targetDate.getDate() + daysDiff);
    }
  } else if (frequency === 'monthly') {
    targetDate.setDate(dayOfMonth);
    if (targetDate <= now) targetDate.setMonth(targetDate.getMonth() + 1);
  }

  return targetDate;
};

export {
  fetchStreamAnalytics,
  exportToCSV,
  exportToPDF,
  calculateSummaryStats,
  generateEmailTemplate,
  sendEmailReport,
  calculateNextSendTime,
};