import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
// Admin analytics dashboard - Phase 6F

import authRoutes from './routes/authRoutes.js';
import classRoutes from './routes/classRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import recordingRoutes from './routes/recordingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
// Port 5001 for Phase 6F admin analytics

import bundleRoutes from './routes/bundleRoutes.js';
import discountRoutes from './routes/discountRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import moderationRoutes from './routes/moderationRoutes.js';
import liveRoutes from './routes/liveRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import securityRoutes from './routes/securityRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import pointsRoutes from './routes/pointsRoutes.js';
import emailRoutes from './routes/emailRoutes.js';
import emailScheduler from './services/emailScheduler.js';
import aiModerationService from './services/aiModerationService.js';

dotenv.config();

const app = express();
const server = createServer(app);
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);
const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Export io through socketInstance for other modules to emit events
import { setIO } from './utils/socketInstance.js';
setIO(io);

// Connect to MongoDB
await connectDB();

// Initialize email scheduler
emailScheduler;

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    // Verify JWT token
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.email = decoded.email;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket.io connection handling with enhanced multi-party signaling
// Track rooms and their participants for proper signaling flow
const roomParticipants = new Map(); // roomId -> [socketId, ...]
const participantInfo = new Map(); // socketId -> { userId, email, roomId }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a user-specific room for targeted notifications
  try {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
  } catch (err) {
    console.warn('Failed to join user room:', err.message);
  }

  // Join video room with enhanced flow
  socket.on('join-room', async (data) => {
    const { roomId } = data;
    
    // Track participant
    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, []);
    }
    roomParticipants.get(roomId).push(socket.id);
    participantInfo.set(socket.id, { userId: socket.userId, email: socket.email, roomId });

    socket.join(roomId);
    console.log(`User ${socket.id} (${socket.email}) joined room ${roomId}`);

    // Get list of existing participants
    const existingParticipants = roomParticipants.get(roomId).filter(id => id !== socket.id);

    // Send existing participants to new user
    socket.emit('existing-participants', {
      participants: existingParticipants.map(id => ({
        socketId: id,
        userId: participantInfo.get(id)?.userId,
        email: participantInfo.get(id)?.email,
      })),
    });

    // Notify others that new user joined (send new user's info)
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId: socket.userId,
      email: socket.email,
    });

    // Log room state
    console.log(`Room ${roomId} now has ${roomParticipants.get(roomId).length} participants`);
  });

  // WebRTC signaling - proper multi-party flow
  // Offer: initiator creates offer for specific peer
  socket.on('offer', (data) => {
    const { roomId, targetSocketId, offer } = data;
    const fromInfo = participantInfo.get(socket.id);
    
    if (!targetSocketId) {
      console.warn('Offer missing targetSocketId');
      return;
    }

    // Send offer only to the specific target
    io.to(targetSocketId).emit('offer', {
      offer,
      from: socket.id,
      fromInfo: { userId: fromInfo.userId, email: fromInfo.email },
    });

    console.log(`Offer sent from ${socket.id} to ${targetSocketId}`);
  });

  // Answer: peer responds with answer
  socket.on('answer', (data) => {
    const { roomId, targetSocketId, answer } = data;
    const fromInfo = participantInfo.get(socket.id);

    if (!targetSocketId) {
      console.warn('Answer missing targetSocketId');
      return;
    }

    // Send answer only to specific peer
    io.to(targetSocketId).emit('answer', {
      answer,
      from: socket.id,
      fromInfo: { userId: fromInfo.userId, email: fromInfo.email },
    });

    console.log(`Answer sent from ${socket.id} to ${targetSocketId}`);
  });

  // ICE Candidates: for establishing connection
  socket.on('ice-candidate', (data) => {
    const { roomId, targetSocketId, candidate } = data;

    if (!targetSocketId) {
      console.warn('ICE candidate missing targetSocketId');
      return;
    }

    // Send candidate to specific peer
    io.to(targetSocketId).emit('ice-candidate', {
      candidate,
      from: socket.id,
    });
  });

  // Chat messages with AI moderation
  socket.on('chat-message', async (data) => {
    try {
      // Moderate the message content
      const moderationResult = await aiModerationService.moderateChatMessage({
        content: data.message,
        userId: socket.userId,
        sessionId: data.roomId,
        timestamp: new Date(),
      });

      if (moderationResult.approved) {
        // Message approved, broadcast to room
        io.to(data.roomId).emit('chat-message', {
          message: data.message,
          sender: socket.userId,
          timestamp: new Date(),
          moderated: false,
        });
      } else {
        // Message flagged, send only to sender with warning
        socket.emit('chat-message-rejected', {
          reason: moderationResult.action,
          categories: Object.keys(moderationResult.categories),
        });

        // Log the moderation action
        console.log(`Chat message moderated: ${moderationResult.action} for user ${socket.userId}`);
      }
    } catch (error) {
      console.error('Error moderating chat message:', error);
      // If moderation fails, allow the message but log the error
      io.to(data.roomId).emit('chat-message', {
        message: data.message,
        sender: socket.userId,
        timestamp: new Date(),
        moderated: false,
      });
    }
  });

  // Leave room
  socket.on('leave-room', (data) => {
    const { roomId } = data;
    
    // Remove from tracking
    if (roomParticipants.has(roomId)) {
      const participants = roomParticipants.get(roomId);
      const index = participants.indexOf(socket.id);
      if (index > -1) {
        participants.splice(index, 1);
      }
      if (participants.length === 0) {
        roomParticipants.delete(roomId);
      }
    }
    participantInfo.delete(socket.id);

    socket.leave(roomId);
    socket.to(roomId).emit('user-left', { socketId: socket.id });
    console.log(`User ${socket.id} left room ${roomId}`);
  });

  socket.on('disconnect', () => {
    const info = participantInfo.get(socket.id);
    if (info) {
      const { roomId } = info;
      
      // Clean up room tracking
      if (roomParticipants.has(roomId)) {
        const participants = roomParticipants.get(roomId);
        const index = participants.indexOf(socket.id);
        if (index > -1) {
          participants.splice(index, 1);
        }
        if (participants.length === 0) {
          roomParticipants.delete(roomId);
        }
      }
      
      // Notify others
      io.to(roomId).emit('user-left', { socketId: socket.id });
    }
    
    participantInfo.delete(socket.id);
    console.log('User disconnected:', socket.id);
  });

  // ==================== Live Streaming Events ====================
  
  // Track live streams and their viewers
  const liveStreamViewers = new Map(); // streamId -> [socketId, ...]
  const viewerStreamInfo = new Map(); // socketId -> { streamId, userId }

  // Join live stream
  socket.on('stream:join', (data) => {
    const { streamId } = data;

    if (!liveStreamViewers.has(streamId)) {
      liveStreamViewers.set(streamId, []);
    }
    liveStreamViewers.get(streamId).push(socket.id);
    viewerStreamInfo.set(socket.id, { streamId, userId: socket.userId });

    socket.join(`stream:${streamId}`);
    console.log(`User ${socket.id} joined live stream ${streamId}`);

    // Broadcast viewer count update
    const viewerCount = liveStreamViewers.get(streamId).length;
    io.to(`stream:${streamId}`).emit('stream:viewer-update', {
      totalViewers: viewerCount,
      timestamp: new Date(),
    });
  });

  // Leave live stream
  socket.on('stream:leave', (data) => {
    const { streamId } = data;

    if (liveStreamViewers.has(streamId)) {
      const viewers = liveStreamViewers.get(streamId);
      const index = viewers.indexOf(socket.id);
      if (index > -1) {
        viewers.splice(index, 1);
      }
      if (viewers.length === 0) {
        liveStreamViewers.delete(streamId);
      }
    }
    viewerStreamInfo.delete(socket.id);

    socket.leave(`stream:${streamId}`);
    console.log(`User ${socket.id} left live stream ${streamId}`);

    // Broadcast viewer count update
    if (liveStreamViewers.has(streamId)) {
      const viewerCount = liveStreamViewers.get(streamId).length;
      io.to(`stream:${streamId}`).emit('stream:viewer-update', {
        totalViewers: viewerCount,
        timestamp: new Date(),
      });
    }
  });

  // Host: Stream started
  socket.on('stream:started', (data) => {
    const { streamId, quality } = data;
    io.to(`stream:${streamId}`).emit('stream:info', {
      status: 'live',
      streamId,
      quality,
      startedAt: new Date(),
    });
    console.log(`Stream ${streamId} started by host ${socket.id}`);
  });

  // Host: Stream stopped
  socket.on('stream:stopped', (data) => {
    const { streamId } = data;
    io.to(`stream:${streamId}`).emit('stream:ended', {
      streamId,
      endedAt: new Date(),
    });
    console.log(`Stream ${streamId} stopped by host ${socket.id}`);
  });

  // Host: Stream stats update
  socket.on('stream:stats', (data) => {
    const { streamId, bitrate, framerate, health } = data;
    io.to(`stream:${streamId}`).emit('stream:stats-update', {
      bitrate,
      framerate,
      health,
      timestamp: new Date(),
    });
  });

  // Viewer: Quality selection
  socket.on('stream:quality-changed', (data) => {
    const { streamId, quality } = data;
    // Could be used for analytics
    console.log(`Viewer ${socket.id} changed quality to ${quality}`);
  });

  // Live chat message
  socket.on('stream:chat', (data) => {
    const { streamId, message } = data;
    io.to(`stream:${streamId}`).emit('stream:chat-message', {
      userId: socket.userId,
      message,
      timestamp: new Date(),
      socketId: socket.id,
    });
  });

  // Viewer engagement tracking
  socket.on('stream:engagement', (data) => {
    const { streamId, engagementMetrics } = data;
    // Track for analytics (could send to database periodically)
    console.log(`Viewer ${socket.id} engagement in stream ${streamId}:`, engagementMetrics);
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    const streamInfo = viewerStreamInfo.get(socket.id);
    if (streamInfo) {
      const { streamId } = streamInfo;

      if (liveStreamViewers.has(streamId)) {
        const viewers = liveStreamViewers.get(streamId);
        const index = viewers.indexOf(socket.id);
        if (index > -1) {
          viewers.splice(index, 1);
        }
        if (viewers.length === 0) {
          liveStreamViewers.delete(streamId);
        }
      }

      // Broadcast viewer count update
      if (liveStreamViewers.has(streamId)) {
        const viewerCount = liveStreamViewers.get(streamId).length;
        io.to(`stream:${streamId}`).emit('stream:viewer-update', {
          totalViewers: viewerCount,
          timestamp: new Date(),
        });
      }
    }
  });
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/analytics/export', exportRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/email', emailRoutes);

// Events API (client-side event tracking)
app.use('/api/events', eventRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Run aggregation job (dev only) - dynamic import
async function runDailyAggregation() {
  try {
    const { default: aggregateEvents } = await import('./jobs/aggregateEvents.js');
    const results = await aggregateEvents({ beforeDate: new Date() });
    console.log('aggregateEvents results:', Array.isArray(results) ? results.length : 0);
  } catch (err) {
    console.error('aggregateEvents run error:', err);
  }
}

// Schedule: every 24 hours
setInterval(() => {
  runDailyAggregation();
}, 24 * 60 * 60 * 1000);

// Dev route to trigger aggregation
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/admin/run-aggregate', async (req, res) => {
    try {
      await runDailyAggregation();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
