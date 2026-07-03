import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  
  sessionNumber: Number,
  title: String,
  description: String,
  
  scheduledStartTime: {
    type: Date,
    required: true,
  },
  scheduledEndTime: {
    type: Date,
    required: true,
  },
  
  // Live session info
  actualStartTime: Date,
  actualEndTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  
  // Recording
  recordingUrl: String,
  recordingDuration: Number,
  recordingTranscript: String,
  recordingSummary: String,
  recordingChapters: [{
    timestamp: Number,
    title: String,
  }],
  recordingKeyTakeaways: [String],
  
  // Chat and discussion
  chatSummary: String,
  isPreviewSession: {
    type: Boolean,
    default: false,
  },
  
  // Attendance
  attendees: [{
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    joinedAt: Date,
    leftAt: Date,
    duration: Number, // in seconds
  }],
  
  // Video room token
  videoRoomToken: String,
  videoRoomId: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('Session', sessionSchema);
