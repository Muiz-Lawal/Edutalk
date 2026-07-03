import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // e.g., view, enroll, play, complete
  targetType: { type: String }, // e.g., class, lesson, video
  targetId: { type: mongoose.Schema.Types.ObjectId },
  value: { type: Number }, // optional numeric value (e.g., duration)
  metadata: { type: mongoose.Schema.Types.Mixed },
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
