import mongoose from 'mongoose';

const hostPaymentProcessorSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, enum: ['paystack', 'stripe'], required: true },
  status: { type: String, enum: ['not_connected', 'pending', 'active', 'action_required', 'rejected'], default: 'not_connected' },
  accountReference: String,
  accountLegalName: String,
  currencies: { type: [String], default: [] },
  statusReason: String,
  connectedAt: Date,
}, { timestamps: true });

hostPaymentProcessorSchema.index({ hostId: 1, provider: 1 }, { unique: true });

export default mongoose.model('HostPaymentProcessor', hostPaymentProcessorSchema);
