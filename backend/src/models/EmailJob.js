import mongoose from 'mongoose';

const emailJobSchema = new mongoose.Schema({
  to: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String },
  template: { type: String },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending','sending','sent','failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastError: { type: String },
  createdAt: { type: Date, default: Date.now },
  sentAt: Date,
}, { timestamps: true });

emailJobSchema.index({ status: 1, attempts: 1, createdAt: 1 });

export default mongoose.model('EmailJob', emailJobSchema);
