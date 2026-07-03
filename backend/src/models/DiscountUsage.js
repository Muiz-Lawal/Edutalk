import mongoose from 'mongoose';

const discountUsageSchema = new mongoose.Schema({
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discount',
    required: true,
  },
  discountCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  itemType: {
    type: String,
    enum: ['Class', 'Bundle'],
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  amount: {
    type: Number,
    default: 0,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

discountUsageSchema.index({ discountId: 1 });
discountUsageSchema.index({ userId: 1 });
discountUsageSchema.index({ discountCode: 1 });
discountUsageSchema.index({ itemId: 1 });

export default mongoose.model('DiscountUsage', discountUsageSchema);
