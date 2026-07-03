import StreamChat from '../models/StreamChat.js';
import StreamViewer from '../models/StreamViewer.js';
import LiveStream from '../models/LiveStream.js';
import User from '../models/User.js';

// Simple moderation keywords (would use AI/ML in production)
const MODERATION_KEYWORDS = {
  blocked: ['hate', 'violence', 'spam', 'abuse'],
  flagged: ['sales', 'link', 'promote'],
};

const moderateMessage = (message) => {
  const lowercaseMsg = message.toLowerCase();
  let isBlocked = false;
  let categories = [];

  for (const keyword of MODERATION_KEYWORDS.blocked) {
    if (lowercaseMsg.includes(keyword)) {
      isBlocked = true;
      categories.push('inappropriate');
    }
  }

  for (const keyword of MODERATION_KEYWORDS.flagged) {
    if (lowercaseMsg.includes(keyword)) {
      categories.push('flagged');
    }
  }

  return {
    approved: !isBlocked,
    action: isBlocked ? 'blocked' : 'approved',
    categories,
    confidence: 0.85,
  };
};

export const sendChatMessage = async (req, res) => {
  try {
    const { liveStreamId } = req.params;
    const { message, messageType = 'text' } = req.body;
    const userId = req.user.userId;

    // Validate message
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    if (message.length > 500) {
      return res.status(400).json({ message: 'Message is too long (max 500 chars)' });
    }

    // Verify stream exists
    const liveStream = await LiveStream.findById(liveStreamId);
    if (!liveStream) {
      return res.status(404).json({ message: 'Stream not found' });
    }

    // Check if chat is enabled
    if (!liveStream.chatEnabled) {
      return res.status(403).json({ message: 'Chat is disabled for this stream' });
    }

    // Get user info
    const user = await User.findById(userId);

    // Moderate message
    const moderationResult = liveStream.chatModerated ? moderateMessage(message) : { approved: true, action: 'approved' };

    // Create chat message
    const chatMessage = new StreamChat({
      liveStreamId,
      userId,
      message,
      messageType,
      senderName: user.name,
      senderAvatar: user.avatar,
      senderEmail: user.email,
      status: moderationResult.approved ? 'approved' : 'blocked',
      moderationResult,
    });

    await chatMessage.save();

    // Update stream message count
    if (chatMessage.status === 'approved') {
      liveStream.totalMessages += 1;
    } else {
      liveStream.blockedMessages += 1;
    }
    await liveStream.save();

    // Update viewer engagement
    if (moderationResult.approved) {
      await StreamViewer.updateMany(
        { userId, liveStreamId },
        { $inc: { chatMessages: 1, engagementScore: 5 } },
      );
    }

    res.status(201).json({
      message: 'Message sent',
      chatMessage,
      status: chatMessage.status,
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { liveStreamId } = req.params;
    const { limit = 50, offset = 0, status = 'approved' } = req.query;

    const query = {
      liveStreamId,
      status: status || { $ne: 'deleted' },
    };

    const messages = await StreamChat.find(query)
      .populate('userId', 'name email avatar')
      .populate('replyTo', 'message senderName')
      .sort({ timestamp: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    const totalCount = await StreamChat.countDocuments(query);

    res.json({
      messages: messages.reverse(),
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteChatMessage = async (req, res) => {
  try {
    const { liveStreamId, messageId } = req.params;
    const userId = req.user.userId;

    // Get message
    const chatMessage = await StreamChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify authorization (own message or moderator)
    const liveStream = await LiveStream.findById(liveStreamId);
    const isOwner = chatMessage.userId.toString() === userId.toString();
    const isHost = liveStream.hostId.toString() === userId.toString();

    if (!isOwner && !isHost) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Delete message
    chatMessage.status = 'deleted';
    chatMessage.deletedBy = userId;
    chatMessage.deletedAt = new Date();
    chatMessage.deletionReason = req.body.reason || 'Deleted by moderator';

    await chatMessage.save();

    res.json({
      message: 'Message deleted',
      chatMessage,
    });
  } catch (error) {
    console.error('Error deleting chat message:', error);
    res.status(500).json({ message: error.message });
  }
};

export const pinMessage = async (req, res) => {
  try {
    const { liveStreamId, messageId } = req.params;
    const userId = req.user.userId;

    // Verify host
    const liveStream = await LiveStream.findById(liveStreamId);
    if (liveStream.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only host can pin messages' });
    }

    const chatMessage = await StreamChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    chatMessage.isPinned = true;
    chatMessage.pinnedBy = userId;
    chatMessage.pinnedAt = new Date();

    await chatMessage.save();

    res.json({
      message: 'Message pinned',
      chatMessage,
    });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ message: error.message });
  }
};

export const unpinMessage = async (req, res) => {
  try {
    const { liveStreamId, messageId } = req.params;
    const userId = req.user.userId;

    // Verify host
    const liveStream = await LiveStream.findById(liveStreamId);
    if (liveStream.hostId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only host can unpin messages' });
    }

    const chatMessage = await StreamChat.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }

    chatMessage.isPinned = false;
    chatMessage.pinnedBy = null;
    chatMessage.pinnedAt = null;

    await chatMessage.save();

    res.json({
      message: 'Message unpinned',
      chatMessage,
    });
  } catch (error) {
    console.error('Error unpinning message:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getModerationStats = async (req, res) => {
  try {
    const { liveStreamId } = req.params;

    const stats = await StreamChat.aggregate([
      { $match: { liveStreamId: require('mongoose').Types.ObjectId(liveStreamId) } },
      {
        $facet: {
          statusBreakdown: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
              },
            },
          ],
          categoryBreakdown: [
            { $unwind: '$moderationResult.categories' },
            {
              $group: {
                _id: '$moderationResult.categories',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    res.json({
      stats: stats[0] || { statusBreakdown: [], categoryBreakdown: [] },
    });
  } catch (error) {
    console.error('Error getting moderation stats:', error);
    res.status(500).json({ message: error.message });
  }
};
