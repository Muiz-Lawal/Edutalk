import mongoose from 'mongoose';
import AnalyticsExport from '../models/AnalyticsExport.js';
import ReportSchedule from '../models/ReportSchedule.js';
import LiveStream from '../models/LiveStream.js';
import {
  exportToCSV,
  exportToPDF,
  calculateNextSendTime,
  calculateSummaryStats,
  fetchStreamAnalytics,
} from '../services/exportService.js';

/**
 * Export analytics data to CSV format
 * GET /api/analytics/export/csv
 * Query params: streamId, startDate, endDate, format
 */
export const exportAnalyticsCSV = async (req, res) => {
  try {
    const { streamId, startDate, endDate, format = 'detailed' } = req.query;
    const userId = req.user._id;

    if (!streamId) {
      return res.status(400).json({
        success: false,
        message: 'streamId is required',
      });
    }

    // Verify stream exists and user has access
    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    // Check if user is the host or authorized
    if (stream.hostId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to export this stream data',
      });
    }

    // Generate CSV
    const csvData = await exportToCSV(streamId, null, startDate, endDate);

    // Save export record
    const filename = `stream_analytics_${streamId}_${Date.now()}.csv`;
    const fileSize = Buffer.byteLength(csvData, 'utf8');

    const exportRecord = await AnalyticsExport.create({
      streamId: new mongoose.Types.ObjectId(streamId),
      userId: new mongoose.Types.ObjectId(userId),
      exportType: 'csv',
      format,
      downloadUrl: `/api/analytics/exports/${filename}`,
      fileSize,
      includedMetrics: [
        'viewers',
        'bitrate',
        'quality',
        'engagement',
        'chat',
        'health',
      ],
    });

    // Set response headers for download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileSize);

    return res.send(csvData);
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: error.message,
    });
  }
};

/**
 * Export analytics data to PDF format
 * GET /api/analytics/export/pdf
 * Query params: streamId, startDate, endDate, format
 */
export const exportAnalyticsPDF = async (req, res) => {
  try {
    const { streamId, startDate, endDate, format = 'summary' } = req.query;
    const userId = req.user._id;

    if (!streamId) {
      return res.status(400).json({
        success: false,
        message: 'streamId is required',
      });
    }

    // Verify stream exists and user has access
    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    // Check if user is the host or authorized
    if (stream.hostId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to export this stream data',
      });
    }

    // Generate PDF
    const pdfBuffer = await exportToPDF(streamId, null, format, startDate, endDate);

    // Save export record
    const filename = `stream_analytics_${streamId}_${Date.now()}.pdf`;

    const exportRecord = await AnalyticsExport.create({
      streamId: new mongoose.Types.ObjectId(streamId),
      userId: new mongoose.Types.ObjectId(userId),
      exportType: 'pdf',
      format,
      downloadUrl: `/api/analytics/exports/${filename}`,
      fileSize: pdfBuffer.length,
      includedMetrics: [
        'viewers',
        'bitrate',
        'quality',
        'engagement',
        'chat',
        'health',
      ],
    });

    // Set response headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting analytics to PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export analytics',
      error: error.message,
    });
  }
};

/**
 * Schedule email analytics report
 * POST /api/analytics/export/email
 * Body: { streamId, recipients: [], frequency, dayOfWeek?, dayOfMonth?, hour, minute, timezone, reportType, subject, includeAttachment }
 */
export const emailAnalyticsReport = async (req, res) => {
  try {
    const {
      streamId,
      recipients,
      frequency,
      dayOfWeek,
      dayOfMonth,
      hour = 9,
      minute = 0,
      timezone = 'America/New_York',
      reportType = 'summary',
      subject = 'Analytics Report',
      includeAttachment = true,
    } = req.body;

    const userId = req.user._id;

    // Validate required fields
    if (!streamId || !recipients || recipients.length === 0 || !frequency) {
      return res.status(400).json({
        success: false,
        message: 'streamId, recipients, and frequency are required',
      });
    }

    // Validate frequency-specific fields
    if (frequency === 'weekly' && dayOfWeek === undefined) {
      return res.status(400).json({
        success: false,
        message: 'dayOfWeek is required for weekly frequency',
      });
    }

    if (frequency === 'monthly' && !dayOfMonth) {
      return res.status(400).json({
        success: false,
        message: 'dayOfMonth is required for monthly frequency',
      });
    }

    // Verify stream exists and user has access
    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({
        success: false,
        message: 'Stream not found',
      });
    }

    // Check if user is the host or authorized
    if (stream.hostId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to schedule reports for this stream',
      });
    }

    // Calculate next send time
    const nextSendAt = calculateNextSendTime(
      frequency,
      dayOfWeek,
      dayOfMonth,
      hour,
      minute,
      timezone
    );

    // Create report schedule
    const reportSchedule = await ReportSchedule.create({
      userId: new mongoose.Types.ObjectId(userId),
      hostId: stream.hostId,
      streamId: new mongoose.Types.ObjectId(streamId),
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      hour,
      minute,
      timezone,
      recipients,
      subject,
      includeAttachment,
      includeMetrics: [
        'viewers',
        'bitrate',
        'quality',
        'engagement',
        'chat',
        'health',
      ],
      reportType,
      isActive: true,
      nextSendAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Report schedule created successfully',
      data: {
        scheduleId: reportSchedule._id,
        frequency,
        nextSendAt,
        recipients: recipients.length,
        isActive: reportSchedule.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating email report schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create report schedule',
      error: error.message,
    });
  }
};

/**
 * Get export history for a stream
 * GET /api/analytics/exports
 * Query params: streamId, limit, page
 */
export const getExportHistory = async (req, res) => {
  try {
    const { streamId, limit = 10, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { userId: new mongoose.Types.ObjectId(userId) };

    if (streamId) {
      query.streamId = new mongoose.Types.ObjectId(streamId);
    }

    const skip = (page - 1) * limit;

    const exports = await AnalyticsExport.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await AnalyticsExport.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        exports,
        pagination: {
          total,
          limit: parseInt(limit),
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching export history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch export history',
      error: error.message,
    });
  }
};

/**
 * Get scheduled reports
 * GET /api/analytics/schedules
 * Query params: streamId, limit, page
 */
export const getScheduledReports = async (req, res) => {
  try {
    const { streamId, limit = 10, page = 1 } = req.query;
    const userId = req.user._id;

    const query = { userId: new mongoose.Types.ObjectId(userId), isActive: true };

    if (streamId) {
      query.streamId = new mongoose.Types.ObjectId(streamId);
    }

    const skip = (page - 1) * limit;

    const schedules = await ReportSchedule.find(query)
      .sort({ nextSendAt: 1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await ReportSchedule.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        schedules,
        pagination: {
          total,
          limit: parseInt(limit),
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled reports',
      error: error.message,
    });
  }
};

/**
 * Update scheduled report
 * PUT /api/analytics/schedules/:scheduleId
 */
export const updateScheduledReport = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user._id;
    const { frequency, dayOfWeek, dayOfMonth, hour, minute, recipients, isActive, reportType } = req.body;

    // Verify ownership
    const schedule = await ReportSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    if (schedule.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this schedule',
      });
    }

    // Update fields
    const updateData = {};
    if (frequency) {
      updateData.frequency = frequency;
      updateData.dayOfWeek = frequency === 'weekly' ? dayOfWeek : undefined;
      updateData.dayOfMonth = frequency === 'monthly' ? dayOfMonth : undefined;

      // Recalculate next send time
      updateData.nextSendAt = calculateNextSendTime(
        frequency,
        dayOfWeek,
        dayOfMonth,
        hour || schedule.hour,
        minute !== undefined ? minute : schedule.minute,
        schedule.timezone
      );
    }

    if (hour !== undefined) updateData.hour = hour;
    if (minute !== undefined) updateData.minute = minute;
    if (recipients) updateData.recipients = recipients;
    if (reportType) updateData.reportType = reportType;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await ReportSchedule.findByIdAndUpdate(scheduleId, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating scheduled report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update schedule',
      error: error.message,
    });
  }
};

/**
 * Delete scheduled report
 * DELETE /api/analytics/schedules/:scheduleId
 */
export const deleteScheduledReport = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user._id;

    // Verify ownership
    const schedule = await ReportSchedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule not found',
      });
    }

    if (schedule.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this schedule',
      });
    }

    await ReportSchedule.findByIdAndDelete(scheduleId);

    return res.status(200).json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete schedule',
      error: error.message,
    });
  }
};
