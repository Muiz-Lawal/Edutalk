import mongoose from 'mongoose';

const strikeEventSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['late_cancellation'], required: true },
  at: { type: Date, default: Date.now },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  reason: String,
}, { timestamps: true });

export default mongoose.model('StrikeEvent', strikeEventSchema);
