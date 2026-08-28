import mongoose from 'mongoose';

const pointsLedgerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['achievement', 'bonus', 'penalty', 'adjustment', 'redeem', 'refund'],
    default: 'achievement',
  },
  amount: {
    type: Number,
    required: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    index: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  description: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const normalizeObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return null;
};

pointsLedgerSchema.statics.getBalance = async function (userId) {
  const normalizedUserId = normalizeObjectId(userId);
  if (!normalizedUserId) return 0;

  const result = await this.aggregate([
    { $match: { userId: normalizedUserId } },
    { $group: { _id: '$userId', balance: { $sum: '$amount' } } },
  ]);

  return result.length > 0 ? result[0].balance : 0;
};

pointsLedgerSchema.statics.record = async function ({ userId, type = 'achievement', amount, classId, referenceId, description, metadata, session = null }) {
  if (!userId || typeof amount !== 'number') {
    throw new Error('PointsLedger.record requires userId and numeric amount');
  }

  const normalizedUserId = normalizeObjectId(userId);
  const normalizedClassId = normalizeObjectId(classId);
  const normalizedReferenceId = normalizeObjectId(referenceId);
  const entry = new this({
    userId: normalizedUserId || userId,
    type,
    amount,
    classId: normalizedClassId || classId,
    referenceId: normalizedReferenceId || referenceId,
    description,
    metadata,
  });

  // Support transactions when session provided
  if (session) {
    return entry.save({ session });
  }

  return entry.save();
};

pointsLedgerSchema.index({ userId: 1, type: 1, createdAt: -1 });
pointsLedgerSchema.index({ classId: 1 });

export default mongoose.model('PointsLedger', pointsLedgerSchema);
