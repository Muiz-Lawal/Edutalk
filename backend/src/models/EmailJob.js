import mongoose from 'mongoose';

const emailJobSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String },
  template: { type: String },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  entityId: { type: String },
  scheduledAt: { type: Date, default: Date.now },
  quotaDate: String,
  status: { type: String, enum: ['pending','sending','sent','failed','suppressed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastError: { type: String },
  createdAt: { type: Date, default: Date.now },
  sentAt: Date,
}, { timestamps: true });

emailJobSchema.index({ status: 1, attempts: 1, createdAt: 1 });
emailJobSchema.index(
  { userId: 1, template: 1, entityId: 1 },
  { unique: true, partialFilterExpression: { userId: { $exists: true }, template: { $exists: true }, entityId: { $exists: true } } },
);

export default mongoose.model('EmailJob', emailJobSchema);
