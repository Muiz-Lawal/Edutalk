import SessionMVP from '../models/SessionMVP.js';

/**
 * Generates sessions for a class based on its schedule
 * @param {Object} classDoc - Class document with schedule
 * @param {Number} numberOfWeeks - Number of weeks to generate (default 8)
 * @returns {Promise<Array>} - Array of created Session documents
 */
export const generateSessionsForClass = async (classDoc, numberOfWeeks = 8) => {
  try {
    if (!classDoc.schedule || classDoc.schedule.length === 0) {
      throw new Error('Class has no schedule defined');
    }

    const sessions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate sessions for specified number of weeks
    for (let week = 0; week < numberOfWeeks; week++) {
      for (const scheduleItem of classDoc.schedule) {
        // Calculate the date for this day of the week in this week
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() + (week * 7 + (scheduleItem.dayOfWeek - today.getDay() + 7) % 7));

        // Only create session if it's in the future
        if (sessionDate >= today) {
          const session = new SessionMVP({
            classId: classDoc._id,
            hostId: classDoc.hostId,
            date: sessionDate,
            startTime: scheduleItem.startTime,
            endTime: scheduleItem.endTime,
            timezone: scheduleItem.timezone || 'UTC',
            status: 'scheduled',
            chatEnabled: true,
          });

          sessions.push(session);
        }
      }
    }

    // Bulk save all sessions
    const savedSessions = await SessionMVP.insertMany(sessions);

    // Update class with total sessions count
    await classDoc.updateOne({
      totalSessions: savedSessions.length,
    });

    console.log(`Generated ${savedSessions.length} sessions for class ${classDoc._id}`);
    return savedSessions;
  } catch (error) {
    console.error('Error generating sessions:', error);
    throw error;
  }
};

/**
 * Gets all upcoming sessions for a class
 * @param {ObjectId} classId - Class ID
 * @returns {Promise<Array>} - Array of upcoming sessions
 */
export const getUpcomingSessions = async (classId) => {
  try {
    const now = new Date();
    const sessions = await SessionMVP.find({
      classId,
      date: { $gte: now },
      status: { $in: ['scheduled', 'live'] },
    }).sort({ date: 1 });

    return sessions;
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    throw error;
  }
};

/**
 * Gets session details with populated class and host info
 * @param {ObjectId} sessionId - Session ID
 * @returns {Promise<Object>} - Session details with populated references
 */
export const getSessionDetails = async (sessionId) => {
  try {
    const session = await SessionMVP.findById(sessionId)
      .populate('classId', 'title description category hostId monthlyPrice')
      .populate('hostId', 'firstName lastName email');

    return session;
  } catch (error) {
    console.error('Error fetching session details:', error);
    throw error;
  }
};

/**
 * Cancels a session
 * @param {ObjectId} sessionId - Session ID
 * @returns {Promise<Object>} - Updated session
 */
export const cancelSession = async (sessionId) => {
  try {
    const session = await SessionMVP.findByIdAndUpdate(
      sessionId,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );

    return session;
  } catch (error) {
    console.error('Error cancelling session:', error);
    throw error;
  }
};

/**
 * Marks a session as completed
 * @param {ObjectId} sessionId - Session ID
 * @param {Object} data - Completion data (recordingUrl, attendeeCount, etc.)
 * @returns {Promise<Object>} - Updated session
 */
export const completeSession = async (sessionId, data = {}) => {
  try {
    const session = await SessionMVP.findByIdAndUpdate(
      sessionId,
      {
        status: 'completed',
        recordingUrl: data.recordingUrl || null,
        recordingDuration: data.recordingDuration || null,
        hasRecording: !!data.recordingUrl,
        attendeeCount: data.attendeeCount || 0,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    return session;
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
};

/**
 * Gets all sessions for a date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {ObjectId} classId - Optional class ID filter
 * @returns {Promise<Array>} - Array of sessions
 */
export const getSessionsInRange = async (startDate, endDate, classId = null) => {
  try {
    const query = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (classId) {
      query.classId = classId;
    }

    const sessions = await SessionMVP.find(query).sort({ date: 1 });
    return sessions;
  } catch (error) {
    console.error('Error fetching sessions in range:', error);
    throw error;
  }
};
