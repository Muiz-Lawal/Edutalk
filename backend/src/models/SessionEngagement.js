import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  isHost: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['open', 'answered', 'dismissed'], default: 'open' },
}, { timestamps: true });

const pollSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true, maxlength: 300 },
  options: [{ label: { type: String, required: true, maxlength: 120 }, votes: { type: Number, default: 0 } }],
  anonymous: { type: Boolean, default: false },
  status: { type: String, enum: ['draft', 'live', 'ended'], default: 'draft' },
  resultsShared: { type: Boolean, default: false },
  voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ sessionId: 1, createdAt: 1 });
questionSchema.index({ sessionId: 1, status: 1, createdAt: 1 });
pollSchema.index({ sessionId: 1, status: 1 });

export const SessionMessage = mongoose.model('SessionMessage', messageSchema);
export const SessionQuestion = mongoose.model('SessionQuestion', questionSchema);
export const SessionPoll = mongoose.model('SessionPoll', pollSchema);
