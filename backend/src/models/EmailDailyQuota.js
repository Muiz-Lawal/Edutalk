import mongoose from 'mongoose';

const emailDailyQuotaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dateKey: { type: String, required: true },
  count: { type: Number, default: 0 },
  jobIds: [{ type: mongoose.Schema.Types.ObjectId }],
}, { timestamps: true });

emailDailyQuotaSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model('EmailDailyQuota', emailDailyQuotaSchema);
