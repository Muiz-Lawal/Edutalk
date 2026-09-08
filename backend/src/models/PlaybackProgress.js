import mongoose from 'mongoose';

const playbackProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recording', required: true },
  percentWatched: { type: Number, min: 0, max: 100, default: 0 },
  lastPosition: { type: Number, min: 0, default: 0 },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

playbackProgressSchema.index({ userId: 1, recordingId: 1 }, { unique: true });

export default mongoose.model('PlaybackProgress', playbackProgressSchema);
