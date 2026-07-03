import VideoRoom from '../models/VideoRoom.js';
import Session from '../models/Session.js';
import { v4 as uuidv4 } from 'uuid';

export const createVideoRoom = async (req, res) => {
  try {
    const { classId, sessionId } = req.body;

    // Create unique room ID
    const roomId = `room-${uuidv4()}`;

    const videoRoom = new VideoRoom({
      classId,
      sessionId,
      roomId,
      hostId: req.user.userId,
      status: 'created',
    });

    await videoRoom.save();

    res.status(201).json({
      message: 'Video room created',
      videoRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVideoRoomToken = async (req, res) => {
  try {
    const { roomId } = req.params;

    const videoRoom = await VideoRoom.findOne({ roomId });

    if (!videoRoom) {
      return res.status(404).json({ message: 'Video room not found' });
    }

    // Generate WebRTC token (simple implementation)
    const token = {
      roomId: videoRoom.roomId,
      userId: req.user.userId.toString(),
      email: req.user.email,
      isHost: videoRoom.hostId.toString() === req.user.userId.toString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      ],
    };

    res.json({
      token: Buffer.from(JSON.stringify(token)).toString('base64'),
      videoRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const joinVideoRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const videoRoom = await VideoRoom.findOneAndUpdate(
      { roomId },
      {
        $push: {
          participants: {
            userId: req.user.userId,
            email: req.user.email,
            joinedAt: new Date(),
            isHost: false,
          },
        },
        status: 'active',
      },
      { new: true }
    );

    if (!videoRoom) {
      return res.status(404).json({ message: 'Video room not found' });
    }

    res.json({
      message: 'Joined video room',
      videoRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const leaveVideoRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const videoRoom = await VideoRoom.findOneAndUpdate(
      { roomId },
      {
        $set: {
          'participants.$[elem].leftAt': new Date(),
        },
      },
      {
        arrayFilters: [{ 'elem.userId': req.user.userId }],
        new: true,
      }
    );

    res.json({
      message: 'Left video room',
      videoRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const closeVideoRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const videoRoom = await VideoRoom.findOneAndUpdate(
      { roomId },
      {
        status: 'closed',
        closedAt: new Date(),
      },
      { new: true }
    );

    if (!videoRoom) {
      return res.status(404).json({ message: 'Video room not found' });
    }

    res.json({
      message: 'Video room closed',
      videoRoom,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getVideoRoomStats = async (req, res) => {
  try {
    const { roomId } = req.params;

    const videoRoom = await VideoRoom.findOne({ roomId });

    if (!videoRoom) {
      return res.status(404).json({ message: 'Video room not found' });
    }

    const stats = {
      roomId: videoRoom.roomId,
      status: videoRoom.status,
      participantCount: videoRoom.participants.filter(p => !p.leftAt).length,
      totalParticipants: videoRoom.participants.length,
      duration: videoRoom.closedAt
        ? (videoRoom.closedAt - videoRoom.createdAt) / 1000
        : (Date.now() - videoRoom.createdAt) / 1000,
      participants: videoRoom.participants.map(p => ({
        email: p.email,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        duration: p.leftAt ? (p.leftAt - p.joinedAt) / 1000 : null,
        isHost: p.isHost,
      })),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
