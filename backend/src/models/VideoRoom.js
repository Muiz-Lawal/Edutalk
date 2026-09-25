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
  waitingRoomEnabled: { type: Boolean, default: true },
  locked: { type: Boolean, default: false },
  presenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activePresenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coHosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  removedUsers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    removedAt: { type: Date, default: Date.now },
    rejoinBlockedUntil: Date,
    removedUntil: Date,
  }],
  breakoutRooms: [{
    name: { type: String, required: true },
    roomId: { type: String, required: true },
    durationMinutes: { type: Number, enum: [5, 10, 15], default: 10 },
    status: { type: String, enum: ['draft', 'open', 'closing', 'closed'], default: 'draft' },
    openedAt: Date,
    closesAt: Date,
    closingAt: Date,
    participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  breakoutState: {
    status: { type: String, enum: ['idle', 'open', 'closing'], default: 'idle' },
    announcement: String,
    closeAt: Date,
  },
  
  // Participants
  participants: [{
    participantKey: { type: String },
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    socketId: String,
    joinedAt: Date,
    leftAt: Date,
    isHost: Boolean,
    role: { type: String, enum: ['host', 'cohost', 'student'], default: 'student' },
    admittedAt: Date,
    waiting: { type: Boolean, default: true },
    membership: { type: String, enum: ['main', 'breakout'], default: 'main' },
    breakoutRoomId: String,
    connectionStatus: { type: String, enum: ['online', 'disconnected', 'left'], default: 'online' },
    disconnectedAt: Date,
    offlineUntil: Date,
    removedAt: Date,
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
  endedAt: Date,
}, { timestamps: true });

videoRoomSchema.index({ roomId: 1, 'participants.participantKey': 1 }, { unique: true, sparse: true });

export default mongoose.model('VideoRoom', videoRoomSchema);
