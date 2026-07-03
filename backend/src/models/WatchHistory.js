import mongoose from 'mongoose';

const watchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recordingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recording',
    required: true,
  },
  
  // Watch tracking
  watchedAt: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number,
    default: 0, // seconds watched
  },
  lastPosition: {
    type: Number,
    default: 0, // where they left off (seconds)
  },
  finished: {
    type: Boolean,
    default: false,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Indexes for better query performance
watchHistorySchema.index({ userId: 1 });
watchHistorySchema.index({ recordingId: 1 });
watchHistorySchema.index({ userId: 1, recordingId: 1 });

export default mongoose.model('WatchHistory', watchHistorySchema);
