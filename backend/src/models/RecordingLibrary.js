import mongoose from 'mongoose';

const recordingLibrarySchema = new mongoose.Schema({
  recordingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recording', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  sharedAt: { type: Date, default: Date.now },
}, { timestamps: true });

recordingLibrarySchema.index({ recordingId: 1, userId: 1 }, { unique: true });
recordingLibrarySchema.index({ userId: 1, sharedAt: -1 });

export default mongoose.model('RecordingLibrary', recordingLibrarySchema);
