import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  // Reference to Class
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassMVP',
    required: true,
  },
  
  // Host reference (denormalized for quick access)
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Session Timing
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // "HH:MM" format
    required: true,
  },
  endTime: {
    type: String, // "HH:MM" format
    required: true,
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  
  // Video/Recording
  videoKey: {
    type: String,
    default: null, // For WebRTC room identifier
  },
  recordingUrl: {
    type: String,
    default: null,
  },
  recordingDuration: {
    type: Number, // seconds
    default: null,
  },
  hasRecording: {
    type: Boolean,
    default: false,
  },
  
  // Attendees
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  attendeeCount: {
    type: Number,
    default: 0,
  },
  
  // Session Analytics
  avgWatchTime: {
    type: Number, // minutes
    default: 0,
  },
  engagement: {
    type: Number, // 0-100
    default: 0,
  },
  
  // Chat
  chatEnabled: {
    type: Boolean,
    default: true,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
sessionSchema.index({ classId: 1 });
sessionSchema.index({ hostId: 1 });
sessionSchema.index({ date: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ createdAt: -1 });

export default mongoose.model('SessionMVP', sessionSchema);
