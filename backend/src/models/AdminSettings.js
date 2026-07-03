import mongoose from 'mongoose';

const adminSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: mongoose.Schema.Types.Mixed,
  category: {
    type: String,
    enum: ['commission', 'payment', 'feature', 'email', 'security', 'general'],
    default: 'general',
  },
  description: String,
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedByEmail: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update timestamp
adminSettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('AdminSettings', adminSettingsSchema);
