import mongoose from 'mongoose';

const verificationCodeSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  codeHash: { type: String, required: true },
  purpose: { type: String, enum: ['email_verification', 'password_reset'], required: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  consumedAt: { type: Date, default: null },
}, { timestamps: true, collection: 'verification_codes' });

verificationCodeSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.models.VerificationCode || mongoose.model('VerificationCode', verificationCodeSchema);
