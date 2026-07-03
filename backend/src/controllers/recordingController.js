import Recording from '../models/Recording.js';
import WatchHistory from '../models/WatchHistory.js';
import Session from '../models/Session.js';
import { transcribeAudio, summarizeContent, generateChapters } from '../utils/ai.js';

/**
 * 1. Get all public recordings with pagination and filtering
 */
export const getRecordings = async (req, res) => {
  try {
    const { classId, page = 1, limit = 20, sortBy = 'uploadedAt' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query for public recordings
    const query = {
      isPublic: true,
      isDeleted: false,
      status: 'ready',
    };

    // Filter by classId if provided
    if (classId) {
      query.classId = classId;
    }

    // Get recordings with pagination and sort
    const recordings = await Recording.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ uploadedAt: -1 })
      .select('_id title description thumbnail duration resolution viewCount rating uploadedAt hostId classId');

    // Get total count for pagination
    const total = await Recording.countDocuments(query);

    res.json({
      data: recordings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recordings', error: error.message });
  }
};

/**
 * 2. Get single recording by ID with full details
 */
export const getRecordingById = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user?.userId;

    // Find recording
    const recording = await Recording.findById(recordingId)
      .populate('hostId', '_id name email avatar')
      .populate('classId', '_id title');

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check access control
    if (!recording.isPublic && recording.hostId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied: This is a private recording' });
    }

    // If recording is soft deleted, return 404
    if (recording.isDeleted) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    res.json({
      data: recording,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recording', error: error.message });
  }
};

/**
 * 3. Track recording view and create watch history
 */
export const trackRecordingView = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const { watchedSeconds } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find recording
    const recording = await Recording.findById(recordingId);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user has access (public or owner)
    if (!recording.isPublic && recording.hostId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    recording.viewCount = (recording.viewCount || 0) + 1;
    await recording.save();

    // Create or update watch history
    const finished = watchedSeconds && recording.duration ? watchedSeconds >= recording.duration * 0.95 : false;

    const watchHistory = await WatchHistory.findOneAndUpdate(
      { userId, recordingId },
      {
        userId,
        recordingId,
        watchedAt: new Date(),
        duration: watchedSeconds || 0,
        lastPosition: watchedSeconds || 0,
        finished: finished,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Watch history recorded',
      data: {
        viewCount: recording.viewCount,
        watchHistory: watchHistory,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error tracking view', error: error.message });
  }
};

/**
 * 4. Get user's own recordings (for host/creator)
 */
export const getUserRecordings = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get all recordings owned by user (public and private)
    const recordings = await Recording.find({
      hostId: userId,
      isDeleted: false,
    })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ uploadedAt: -1 })
      .populate('classId', '_id title')
      .select('_id title description thumbnail duration resolution viewCount downloadCount rating uploadedAt status isPublic allowDownload');

    // Get total count
    const total = await Recording.countDocuments({
      hostId: userId,
      isDeleted: false,
    });

    res.json({
      data: recordings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user recordings', error: error.message });
  }
};

/**
 * 5. Delete a recording (soft delete)
 */
export const deleteRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Find recording
    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    // Check if user is the owner
    if (recording.hostId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Only the recording owner can delete this recording' });
    }

    // Soft delete
    recording.isDeleted = true;
    recording.updatedAt = new Date();
    await recording.save();

    res.json({
      message: 'Recording deleted successfully',
      data: {
        recordingId: recording._id,
        deletedAt: recording.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting recording', error: error.message });
  }
};

// ============================================
// Legacy Functions (Kept for backward compatibility)
// ============================================

export const startRecording = async (req, res) => {
  try {
    const { sessionId, classId } = req.body;

    const recording = new Recording({
      sessionId,
      classId,
      status: 'recording',
      title: `Recording - ${new Date().toISOString()}`,
    });

    await recording.save();

    res.status(201).json({
      message: 'Recording started',
      recording,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeRecording = async (req, res) => {
  try {
    const { recordingId, videoUrl, duration } = req.body;

    const recording = await Recording.findByIdAndUpdate(
      recordingId,
      {
        status: 'processing',
        storageUrl: videoUrl,
        duration,
        hlsUrl: `${videoUrl}?format=hls`, // Mock HLS URL
        dashUrl: `${videoUrl}?format=dash`, // Mock DASH URL
      },
      { new: true }
    );

    // Trigger async AI processing
    processRecordingAsync(recording._id, videoUrl);

    res.json({
      message: 'Recording processing started',
      recording,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecording = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    res.json(recording);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecordingList = async (req, res) => {
  try {
    const { classId, skip = 0, limit = 20 } = req.query;

    const recordings = await Recording.find({ classId, status: 'ready' })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Recording.countDocuments({ classId, status: 'ready' });

    res.json({
      recordings,
      total,
      skip: parseInt(skip),
      limit: parseInt(limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRecordingStats = async (req, res) => {
  try {
    const { recordingId } = req.params;

    const recording = await Recording.findById(recordingId);

    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const stats = {
      duration: recording.duration,
      fileSize: recording.fileSize,
      transcriptLength: recording.transcript?.length || 0,
      chaptersCount: recording.chapters?.length || 0,
      keyTakeawaysCount: recording.keyTakeaways?.length || 0,
      languages: recording.detectedLanguages || [],
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Async processing function (runs in background)
async function processRecordingAsync(recordingId, videoUrl) {
  try {
    const recording = await Recording.findById(recordingId);

    // Step 1: Transcribe
    console.log('Transcribing recording...');
    const transcript = await transcribeAudio(videoUrl);
    recording.transcript = transcript;

    // Step 2: Generate summary
    console.log('Generating summary...');
    const summary = await summarizeContent(transcript);
    recording.summary = summary;

    // Step 3: Generate chapters
    console.log('Generating chapters...');
    const chapters = await generateChapters(transcript);
    recording.chapters = chapters;

    // Step 4: Extract key takeaways
    const takeaways = extractKeyTakeaways(summary);
    recording.keyTakeaways = takeaways;

    // Mark as ready
    recording.status = 'ready';
    recording.processingProgress = 100;
    await recording.save();

    console.log('Recording processing complete');
  } catch (error) {
    console.error('Error processing recording:', error);
    const recording = await Recording.findById(recordingId);
    recording.status = 'failed';
    await recording.save();
  }
}

function extractKeyTakeaways(summary) {
  // Simple extraction of key points from summary
  return summary
    .split('.')
    .filter(s => s.trim().length > 20)
    .slice(0, 5);
}
