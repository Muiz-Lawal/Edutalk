import mongoose from 'mongoose';

const strokeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tool: { type: String, enum: ['pen', 'marker', 'eraser', 'rect', 'ellipse', 'arrow', 'line', 'text', 'sticky'], required: true },
  color: { type: String, required: true },
  width: { type: Number, required: true },
  points: [{ x: Number, y: Number }],
  text: String,
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const sessionWhiteboardSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  strokes: { type: [strokeSchema], default: [] },
  studentsCanDraw: { type: Boolean, default: false },
  endedAt: Date,
}, { timestamps: true });

export default mongoose.model('SessionWhiteboard', sessionWhiteboardSchema);
