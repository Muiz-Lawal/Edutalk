import mongoose from 'mongoose';

const paymentChainSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  totalDaysPurchased: { type: Number, default: 0 },
  totalAmountPaidCents: { type: Number, default: 0 },
  lockedMonthlyPriceCents: { type: Number, required: true },
  currentSubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  isFullyPaid: { type: Boolean, default: false },
}, { timestamps: true });

paymentChainSchema.index({ studentId: 1, classId: 1 }, { unique: true });

export default mongoose.model('PaymentChain', paymentChainSchema);
