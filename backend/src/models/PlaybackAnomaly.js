import mongoose from 'mongoose';

const playbackAnomalySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recording', required: true },
  ipAddress: String,
  deviceFingerprint: String,
  detectedAt: { type: Date, default: Date.now },
  signal: { type: String, default: 'concurrent_streaming' },
}, { timestamps: true });

export default mongoose.model('PlaybackAnomaly', playbackAnomalySchema);
