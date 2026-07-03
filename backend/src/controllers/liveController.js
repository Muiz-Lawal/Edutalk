import LiveStream from '../models/LiveStream.js';
import StreamViewer from '../models/StreamViewer.js';
import StreamChat from '../models/StreamChat.js';
import Class from '../models/Class.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== Stream Lifecycle ====================

export const createLiveStream = async (req, res) => {
  try {
    const { classId, title, description, scheduledStartTime, duration } = req.body;

    // Verify class exists and user is host
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }
    if (classDoc.hostId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to create stream' });
    }

    // Create new stream
    const liveStream = new LiveStream({
      classId,
      hostId: req.user.userId,
      title,
      description,
      scheduledStartTime,
      duration,
      streamKey: uuidv4(),
      status: 'scheduled',
      quality: {
        bitrates: [
          { level: '1080p', bitrate: 6000, resolution: '1920x1080' },
          { level: '720p', bitrate: 3000, resolution: '1280x720' },
          { level: '480p', bitrate: 1500, resolution: '854x480' },
        ],
        targetFps: 30,
        enableAdaptive: true,
      },
    });

    await liveStream.save();

    res.status(201).json({
      message: 'Live stream created',
      liveStream,
    });
  } catch (error) {
    console.error('Error creating live stream:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getLiveStream = async (req, res) => {
  try {
    const { id } = req.params;

    const liveStream = await LiveStream.findById(id)
      .populate('hostId', 'email name avatar')
      .populate('classId', 'title');

    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    res.json(liveStream);
  } catch (error) {
    console.error('Error getting live stream:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateLiveStream = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify authorization
    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }
    if (liveStream.hostId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update allowed fields
    const allowedUpdates = ['title', 'description', 'quality', 'chatEnabled', 'chatModerated', 'notificationsEnabled'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        liveStream[field] = updates[field];
      }
    });

    await liveStream.save();

    res.json({
      message: 'Stream updated',
      liveStream,
    });
  } catch (error) {
    console.error('Error updating live stream:', error);
    res.status(500).json({ message: error.message });
  }
};

export const startLiveStream = async (req, res) => {
  try {
    const { id } = req.params;
    const { quality } = req.body;

    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Verify authorization
    if (liveStream.hostId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if already live
    if (liveStream.status === 'live') {
      return res.status(400).json({ message: 'Stream already live' });
    }

    // Update quality if provided
    if (quality) {
      liveStream.quality = quality;
    }

    // Start stream
    liveStream.status = 'live';
    liveStream.startedAt = new Date();
    liveStream.currentViewers = 0;
    liveStream.peakViewers = 0;

    await liveStream.save();

    // Generate playback URL (mock for now, would come from Cloudflare)
    const playbackUrl = `https://videodelivery.net/${liveStream.streamKey}/manifest/video.m3u8`;
    liveStream.playbackUrl = playbackUrl;
    await liveStream.save();

    res.json({
      message: 'Stream started',
      liveStream,
      rtmpUrl: `rtmps://live.cloudflare.com:443/live/`,
      streamKey: liveStream.streamKey,
      playbackUrl,
    });
  } catch (error) {
    console.error('Error starting live stream:', error);
    res.status(500).json({ message: error.message });
  }
};

export const stopLiveStream = async (req, res) => {
  try {
    const { id } = req.params;

    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Verify authorization
    if (liveStream.hostId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (liveStream.status !== 'live') {
      return res.status(400).json({ message: 'Stream is not live' });
    }

    liveStream.status = 'ended';
    liveStream.endedAt = new Date();
    await liveStream.save();

    // Calculate total viewers
    const viewers = await StreamViewer.countDocuments({ liveStreamId: id });
    liveStream.totalViewers = viewers;

    // Calculate average watch time
    const viewerStats = await StreamViewer.aggregate([
      { $match: { liveStreamId: liveStream._id } },
      { $group: { _id: null, avgTime: { $avg: '$totalWatchTime' } } },
    ]);

    if (viewerStats.length > 0) {
      liveStream.avgWatchTime = viewerStats[0].avgTime;
    }

    await liveStream.save();

    res.json({
      message: 'Stream ended',
      liveStream,
      stats: {
        totalViewers: liveStream.totalViewers,
        peakViewers: liveStream.peakViewers,
        avgWatchTime: liveStream.avgWatchTime,
      },
    });
  } catch (error) {
    console.error('Error stopping live stream:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== Viewer Management ====================

export const joinStream = async (req, res) => {
  try {
    const { liveStreamId } = req.body;
    const userId = req.user?.userId || null;
    const sessionId = uuidv4();

    const liveStream = await LiveStream.findById(liveStreamId);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    if (liveStream.status !== 'live') {
      return res.status(400).json({ message: 'Stream is not currently live' });
    }

    // Create viewer session
    const streamViewer = new StreamViewer({
      liveStreamId,
      userId,
      sessionId,
      joinedAt: new Date(),
    });

    await streamViewer.save();

    // Update current viewers
    const currentViewerCount = await StreamViewer.countDocuments({
      liveStreamId,
      leftAt: { $exists: false },
    });

    liveStream.currentViewers = currentViewerCount;

    // Update peak viewers
    if (currentViewerCount > liveStream.peakViewers) {
      liveStream.peakViewers = currentViewerCount;
    }

    // Add to viewer history
    liveStream.viewerHistory.push({
      timestamp: new Date(),
      count: currentViewerCount,
    });

    await liveStream.save();

    res.json({
      message: 'Joined stream',
      sessionId,
      playbackUrl: liveStream.playbackUrl,
      currentViewers: currentViewerCount,
    });
  } catch (error) {
    console.error('Error joining stream:', error);
    res.status(500).json({ message: error.message });
  }
};

export const leaveStream = async (req, res) => {
  try {
    const { liveStreamId, sessionId } = req.body;

    const streamViewer = await StreamViewer.findOne({
      liveStreamId,
      sessionId,
    });

    if (!streamViewer) {
      return res.status(404).json({ message: 'Viewer session not found' });
    }

    // Calculate watch time
    const watchTimeMs = new Date() - streamViewer.joinedAt;
    const watchTimeMinutes = watchTimeMs / (1000 * 60);
    streamViewer.totalWatchTime = Math.round(watchTimeMinutes);
    streamViewer.leftAt = new Date();

    await streamViewer.save();

    // Update current viewers
    const liveStream = await LiveStream.findById(liveStreamId);
    const currentViewerCount = await StreamViewer.countDocuments({
      liveStreamId,
      leftAt: { $exists: false },
    });

    liveStream.currentViewers = currentViewerCount;
    await liveStream.save();

    res.json({
      message: 'Left stream',
      watchTime: streamViewer.totalWatchTime,
      currentViewers: currentViewerCount,
    });
  } catch (error) {
    console.error('Error leaving stream:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== Statistics & Analytics ====================

export const getStreamStats = async (req, res) => {
  try {
    const { id } = req.params;

    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Get viewer count
    const activeViewers = await StreamViewer.countDocuments({
      liveStreamId: id,
      leftAt: { $exists: false },
    });

    const totalViewers = await StreamViewer.countDocuments({
      liveStreamId: id,
    });

    // Get chat stats
    const totalMessages = await StreamChat.countDocuments({
      liveStreamId: id,
    });

    const blockedMessages = await StreamChat.countDocuments({
      liveStreamId: id,
      status: 'blocked',
    });

    // Get engagement metrics
    const engagement = await StreamViewer.aggregate([
      { $match: { liveStreamId: liveStream._id } },
      { $group: { _id: null, avgEngagement: { $avg: '$engagementScore' } } },
    ]);

    res.json({
      liveStream: {
        _id: liveStream._id,
        title: liveStream.title,
        status: liveStream.status,
      },
      stats: {
        currentViewers: activeViewers,
        totalViewers,
        peakViewers: liveStream.peakViewers,
        avgWatchTime: liveStream.avgWatchTime || 0,
        totalMessages,
        blockedMessages,
        avgEngagementScore: engagement.length > 0 ? engagement[0].avgEngagement : 0,
      },
    });
  } catch (error) {
    console.error('Error getting stream stats:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getActiveStreams = async (req, res) => {
  try {
    const liveStreams = await LiveStream.find({
      status: 'live',
    })
      .populate('hostId', 'name email avatar')
      .populate('classId', 'title')
      .sort({ startedAt: -1 });

    res.json({
      activeStreams: liveStreams,
      count: liveStreams.length,
    });
  } catch (error) {
    console.error('Error getting active streams:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getStreamAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const liveStream = await LiveStream.findById(id);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Get quality distribution
    const qualityDistribution = await StreamViewer.aggregate([
      { $match: { liveStreamId: liveStream._id } },
      {
        $group: {
          _id: '$qualitySelected',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get device breakdown
    const deviceBreakdown = await StreamViewer.aggregate([
      { $match: { liveStreamId: liveStream._id } },
      {
        $group: {
          _id: '$deviceInfo.deviceType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get retention (calculate minute-by-minute)
    const retention = {};
    for (let minute = 0; minute <= Math.ceil((liveStream.endedAt - liveStream.startedAt) / 60000); minute++) {
      const timeThreshold = new Date(liveStream.startedAt.getTime() + minute * 60000);
      const viewersAtTime = await StreamViewer.countDocuments({
        liveStreamId: liveStream._id,
        joinedAt: { $lte: timeThreshold },
        $or: [{ leftAt: { $gte: timeThreshold } }, { leftAt: { $exists: false } }],
      });
      retention[minute] = viewersAtTime;
    }

    res.json({
      stream: {
        _id: liveStream._id,
        title: liveStream.title,
        startedAt: liveStream.startedAt,
        endedAt: liveStream.endedAt,
      },
      analytics: {
        totalViewers: liveStream.totalViewers,
        peakViewers: liveStream.peakViewers,
        avgWatchTime: liveStream.avgWatchTime,
        qualityDistribution,
        deviceBreakdown,
        retentionCurve: retention,
      },
    });
  } catch (error) {
    console.error('Error getting stream analytics:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== Viewer Tracking ====================

export const updateViewerEngagement = async (req, res) => {
  try {
    const { sessionId, engagementData } = req.body;
    const { liveStreamId } = req.params;

    const streamViewer = await StreamViewer.findOne({
      sessionId,
      liveStreamId,
    });

    if (!streamViewer) {
      return res.status(404).json({ message: 'Viewer session not found' });
    }

    // Update engagement metrics
    if (engagementData.chatMessages) {
      streamViewer.chatMessages = engagementData.chatMessages;
    }
    if (engagementData.engagementScore !== undefined) {
      streamViewer.engagementScore = Math.min(100, engagementData.engagementScore);
    }
    if (engagementData.networkQuality) {
      streamViewer.networkQuality = {
        ...streamViewer.networkQuality,
        ...engagementData.networkQuality,
      };
    }
    if (engagementData.qualitySelected) {
      streamViewer.qualitySelected = engagementData.qualitySelected;
      streamViewer.qualityAdaptationCount = (streamViewer.qualityAdaptationCount || 0) + 1;
    }

    streamViewer.lastActiveTime = new Date();

    await streamViewer.save();

    res.json({
      message: 'Engagement updated',
      viewer: streamViewer,
    });
  } catch (error) {
    console.error('Error updating viewer engagement:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getStreamViewers = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active' } = req.query;

    let query = { liveStreamId: id };

    if (status === 'active') {
      query.leftAt = { $exists: false };
    } else if (status === 'inactive') {
      query.leftAt = { $exists: true };
    }

    const viewers = await StreamViewer.find(query)
      .populate('userId', 'name email avatar')
      .sort({ joinedAt: -1 })
      .limit(100);

    res.json({
      viewers,
      count: viewers.length,
    });
  } catch (error) {
    console.error('Error getting stream viewers:', error);
    res.status(500).json({ message: error.message });
  }
};
