import mongoose from 'mongoose';

const videoRoomSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  
  // Room details
  roomId: {
    type: String,
    unique: true,
    required: true,
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Status
  status: {
    type: String,
    enum: ['created', 'active', 'closed'],
    default: 'created',
  },
  
  // Room settings
  maxParticipants: Number,
  recordingEnabled: Boolean,
  chatEnabled: {
    type: Boolean,
    default: true,
  },
  screenShareEnabled: {
    type: Boolean,
    default: true,
  },
  
  // Participants
  participants: [{
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    socketId: String,
    joinedAt: Date,
    leftAt: Date,
    isHost: Boolean,
    signalingState: {
      type: String,
      enum: ['stable', 'have-local-offer', 'have-remote-offer', 'have-local-pranswer', 'have-remote-pranswer', 'closed'],
      default: 'stable',
    },
    iceConnectionState: {
      type: String,
      enum: ['new', 'checking', 'connected', 'completed', 'failed', 'disconnected', 'closed'],
      default: 'new',
    },
    iceGatheringState: {
      type: String,
      enum: ['new', 'gathering', 'complete'],
      default: 'new',
    },
    connectionStats: {
      bitrate: Number,
      latency: Number,
      packetLoss: Number,
      jitter: Number,
      videoCodec: String,
      audioCodec: String,
      updatedAt: Date,
    },
    videoEnabled: { type: Boolean, default: true },
    audioEnabled: { type: Boolean, default: true },
    isSpeaker: { type: Boolean, default: false },
  }],
  
  // Recording info
  recordingStartedAt: Date,
  recordingUrl: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: Date,
}, { timestamps: true });

export default mongoose.model('VideoRoom', videoRoomSchema);
