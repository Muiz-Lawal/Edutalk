const StreamMetrics = require('../models/StreamMetrics');
const LiveStream = require('../models/LiveStream');
const StreamViewer = require('../models/StreamViewer');
const StreamChat = require('../models/StreamChat');

/**
 * Get comprehensive stream analytics overview
 */
exports.getStreamAnalytics = async (req, res) => {
  try {
    const { streamId } = req.params;

    const stream = await LiveStream.findById(streamId);
    if (!stream) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    // Get metrics for the stream's duration
    const metrics = await StreamMetrics.find({ liveStreamId: streamId }).sort({
      timestamp: 1,
    });

    if (metrics.length === 0) {
      return res.status(200).json({
        stream: {
          id: stream._id,
          title: stream.title,
          startedAt: stream.startedAt,
          endedAt: stream.endedAt,
          duration: stream.endedAt
            ? (stream.endedAt - stream.startedAt) / 1000
            : 0,
        },
        overview: {
          totalViewers: stream.totalViewers || 0,
          peakViewers: stream.peakViewers || 0,
          averageWatchTime: 0,
          totalChatMessages: stream.totalMessages || 0,
          engagementScore: 0,
        },
        quality: {
          '1080p': 0,
          '720p': 0,
          '480p': 0,
          auto: 0,
        },
        timeline: [],
      });
    }

    // Calculate aggregated metrics
    const totalChatMessages = metrics.reduce(
      (sum, m) => sum + (m.chatMessages || 0),
      0
    );
    const avgEngagement =
      metrics.reduce((sum, m) => sum + (m.averageEngagementScore || 0), 0) /
      metrics.length;

    // Get quality distribution totals
    const qualityTotals = {
      '1080p': 0,
      '720p': 0,
      '480p': 0,
      auto: 0,
    };

    metrics.forEach((m) => {
      Object.keys(m.qualityDistribution).forEach((quality) => {
        qualityTotals[quality] =
          (qualityTotals[quality] || 0) + m.qualityDistribution[quality];
      });
    });

    return res.status(200).json({
      stream: {
        id: stream._id,
        title: stream.title,
        startedAt: stream.startedAt,
        endedAt: stream.endedAt,
        duration: stream.endedAt
          ? (stream.endedAt - stream.startedAt) / 1000
          : 0,
      },
      overview: {
        totalViewers: stream.totalViewers || 0,
        peakViewers: stream.peakViewers || 0,
        averageWatchTime: stream.avgWatchTime || 0,
        totalChatMessages: totalChatMessages,
        engagementScore: Math.round(avgEngagement),
      },
      quality: qualityTotals,
      timeline: metrics.map((m) => ({
        time: m.timestamp,
        viewers: m.viewerCount,
        bitrate: m.averageBitrate,
        chatMessages: m.chatMessages,
      })),
    });
  } catch (error) {
    console.error('Error getting stream analytics:', error);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
};

/**
 * Get viewer count timeline (minute-by-minute)
 */
exports.getViewerTimeline = async (req, res) => {
  try {
    const { streamId } = req.params;

    const metrics = await StreamMetrics.find({ liveStreamId: streamId })
      .select('timestamp viewerCount averageBitrate')
      .sort({ timestamp: 1 });

    const timeline = metrics.map((m) => ({
      time: m.timestamp.toISOString(),
      viewers: m.viewerCount,
      bitrate: m.averageBitrate,
    }));

    res.status(200).json({ timeline });
  } catch (error) {
    console.error('Error getting viewer timeline:', error);
    res.status(500).json({ error: 'Failed to retrieve timeline' });
  }
};

/**
 * Get engagement metrics
 */
exports.getEngagementMetrics = async (req, res) => {
  try {
    const { streamId } = req.params;

    const metrics = await StreamMetrics.find({ liveStreamId: streamId });
    const chatMessages = await StreamChat.countDocuments({
      liveStreamId: streamId,
    });
    const viewers = await StreamViewer.find({ liveStreamId: streamId });

    const totalEngagement = metrics.reduce(
      (sum, m) => sum + (m.averageEngagementScore || 0),
      0
    );
    const avgEngagement =
      metrics.length > 0 ? totalEngagement / metrics.length : 0;

    // Calculate engagement breakdown
    const chatParticipation = (chatMessages / (viewers.length || 1)) * 100;
    const avgWatchTime =
      viewers.length > 0
        ? viewers.reduce((sum, v) => sum + (v.totalWatchTime || 0), 0) /
          viewers.length
        : 0;

    res.status(200).json({
      engagement: {
        averageScore: Math.round(avgEngagement),
        totalChatMessages: chatMessages,
        chatParticipationRate: Math.round(chatParticipation),
        averageWatchTime: Math.round(avgWatchTime * 100) / 100,
        totalViewers: viewers.length,
      },
      timeline: metrics.map((m) => ({
        time: m.timestamp.toISOString(),
        engagement: m.averageEngagementScore,
        chatMessages: m.chatMessages,
      })),
    });
  } catch (error) {
    console.error('Error getting engagement metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve engagement metrics' });
  }
};

/**
 * Get quality distribution
 */
exports.getQualityDistribution = async (req, res) => {
  try {
    const { streamId } = req.params;

    const metrics = await StreamMetrics.find({ liveStreamId: streamId });

    if (metrics.length === 0) {
      return res.status(200).json({
        distribution: {
          '1080p': 0,
          '720p': 0,
          '480p': 0,
          auto: 0,
        },
        timeline: [],
      });
    }

    // Calculate totals
    const totals = {
      '1080p': 0,
      '720p': 0,
      '480p': 0,
      auto: 0,
    };

    metrics.forEach((m) => {
      Object.keys(m.qualityDistribution).forEach((quality) => {
        totals[quality] =
          (totals[quality] || 0) + (m.qualityDistribution[quality] || 0);
      });
    });

    // Calculate percentages
    const totalViewerQualities = Object.values(totals).reduce(
      (sum, val) => sum + val,
      0
    );
    const distribution = {};

    Object.keys(totals).forEach((quality) => {
      distribution[quality] =
        totalViewerQualities > 0
          ? Math.round((totals[quality] / totalViewerQualities) * 100)
          : 0;
    });

    res.status(200).json({
      distribution,
      timeline: metrics.map((m) => ({
        time: m.timestamp.toISOString(),
        distribution: m.qualityDistribution,
      })),
    });
  } catch (error) {
    console.error('Error getting quality distribution:', error);
    res.status(500).json({ error: 'Failed to retrieve quality distribution' });
  }
};

/**
 * Get demographics (browser, OS, device)
 */
exports.getDemographics = async (req, res) => {
  try {
    const { streamId } = req.params;

    const metrics = await StreamMetrics.find({ liveStreamId: streamId });

    if (metrics.length === 0) {
      return res.status(200).json({
        browsers: {},
        operatingSystems: {},
        deviceTypes: {},
      });
    }

    // Aggregate demographics
    const browsers = {};
    const operatingSystems = {};
    const deviceTypes = {};

    metrics.forEach((m) => {
      Object.entries(m.browsers || {}).forEach(([browser, count]) => {
        browsers[browser] = (browsers[browser] || 0) + count;
      });

      Object.entries(m.operatingSystems || {}).forEach(([os, count]) => {
        operatingSystems[os] = (operatingSystems[os] || 0) + count;
      });

      Object.entries(m.deviceTypes || {}).forEach(([device, count]) => {
        deviceTypes[device] = (deviceTypes[device] || 0) + count;
      });
    });

    res.status(200).json({
      browsers,
      operatingSystems,
      deviceTypes,
    });
  } catch (error) {
    console.error('Error getting demographics:', error);
    res.status(500).json({ error: 'Failed to retrieve demographics' });
  }
};

/**
 * Get retention curve (watch time drop-off)
 */
exports.getRetentionCurve = async (req, res) => {
  try {
    const { streamId } = req.params;

    const metrics = await StreamMetrics.find({ liveStreamId: streamId });

    if (metrics.length === 0) {
      return res.status(200).json({
        retention: {
          total: 0,
          '5min': 0,
          '10min': 0,
          '15min': 0,
          '30min': 0,
          '60min': 0,
        },
      });
    }

    // Calculate retention from viewers
    const viewers = await StreamViewer.find({ liveStreamId: streamId });

    const retention = {
      total: viewers.length,
      '5min': 0,
      '10min': 0,
      '15min': 0,
      '30min': 0,
      '60min': 0,
    };

    viewers.forEach((viewer) => {
      const watchTimeMins = viewer.totalWatchTime || 0;

      if (watchTimeMins >= 5) retention['5min']++;
      if (watchTimeMins >= 10) retention['10min']++;
      if (watchTimeMins >= 15) retention['15min']++;
      if (watchTimeMins >= 30) retention['30min']++;
      if (watchTimeMins >= 60) retention['60min']++;
    });

    // Calculate percentages
    const retentionPercentages = {};
    Object.entries(retention).forEach(([key, value]) => {
      if (key === 'total') {
        retentionPercentages[key] = value;
      } else {
        retentionPercentages[key] =
          retention.total > 0
            ? Math.round((value / retention.total) * 100)
            : 0;
      }
    });

    res.status(200).json({
      retention: retentionPercentages,
      timeline: metrics.map((m) => ({
        time: m.timestamp.toISOString(),
        viewers: m.viewerCount,
      })),
    });
  } catch (error) {
    console.error('Error getting retention curve:', error);
    res.status(500).json({ error: 'Failed to retrieve retention data' });
  }
};

/**
 * Aggregate metrics for a stream (called hourly)
 */
exports.aggregateMetrics = async (streamId) => {
  try {
    const stream = await LiveStream.findById(streamId);
    if (!stream) return;

    const viewers = await StreamViewer.find({ liveStreamId: streamId });
    const chatMessages = await StreamChat.find({ liveStreamId: streamId });

    if (viewers.length === 0 && chatMessages.length === 0) return;

    // Calculate metrics
    const viewerCount = viewers.filter((v) => !v.leftAt).length;
    const peakViewerCount = stream.peakViewers || 0;
    const totalUniqueViewers = viewers.length;
    const averageWatchTime =
      viewers.length > 0
        ? viewers.reduce((sum, v) => sum + (v.totalWatchTime || 0), 0) /
          viewers.length
        : 0;

    // Quality distribution
    const qualityDistribution = {
      '1080p': 0,
      '720p': 0,
      '480p': 0,
      auto: 0,
    };

    viewers.forEach((v) => {
      const quality = v.qualitySelected || 'auto';
      qualityDistribution[quality] = (qualityDistribution[quality] || 0) + 1;
    });

    // Calculate average engagement
    const averageEngagementScore =
      viewers.length > 0
        ? viewers.reduce((sum, v) => sum + (v.engagement || 0), 0) /
          viewers.length
        : 0;

    // Demographics
    const browsers = {};
    const operatingSystems = {};
    const deviceTypes = {};

    viewers.forEach((v) => {
      if (v.browser) browsers[v.browser] = (browsers[v.browser] || 0) + 1;
      if (v.os) operatingSystems[v.os] = (operatingSystems[v.os] || 0) + 1;
      // Determine device type
      const deviceType = v.os?.includes('Mobile') ? 'Mobile' : 'Desktop';
      deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
    });

    // Create metrics record
    const metrics = new StreamMetrics({
      liveStreamId: streamId,
      timestamp: new Date(),
      viewerCount,
      peakViewerCount,
      totalUniqueViewers,
      averageWatchTime,
      qualityDistribution,
      chatMessages: chatMessages.length,
      averageEngagementScore,
      browsers,
      operatingSystems,
      deviceTypes,
    });

    await metrics.save();
    return metrics;
  } catch (error) {
    console.error('Error aggregating metrics:', error);
  }
};
