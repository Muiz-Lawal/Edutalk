import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lines: [{
    _id: false,
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    days: { type: Number, min: 1, max: 30, required: true },
  }],
}, { timestamps: true });

export default mongoose.model('Cart', cartSchema);
