import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import SessionWhiteboard from '../models/SessionWhiteboard.js';

async function access(req, sessionId) {
  const session = await Session.findById(sessionId).populate('classId', 'hostId videoMode');
  if (!session) return { error: { status: 404, message: 'Session not found' } };
  if (session.classId.videoMode !== 'builtin') return { error: { status: 403, message: 'Whiteboard is available for built-in classrooms only' } };
  const isHost = String(session.classId.hostId) === String(req.user.userId);
  const enrolled = isHost || await Subscription.exists({
    userId: req.user.userId, classId: session.classId._id, status: 'active',
  });
  if (!enrolled) return { error: { status: 403, message: 'This class needs an active enrollment' } };
  const board = await SessionWhiteboard.findOneAndUpdate(
    { sessionId },
    { $setOnInsert: { sessionId } },
    { new: true, upsert: true },
  );
  return { session, board, isHost };
}

export async function getWhiteboard(req, res) {
  const result = await access(req, req.params.sessionId);
  if (result.error) return res.status(result.error.status).json(result.error);
  return res.json({ strokes: result.board.strokes, studentsCanDraw: result.board.studentsCanDraw, isHost: result.isHost });
}

export async function updateWhiteboard(req, res) {
  const result = await access(req, req.params.sessionId);
  if (result.error) return res.status(result.error.status).json(result.error);
  const { action, stroke, studentsCanDraw } = req.body;
  if (action === 'permission') {
    if (!result.isHost) return res.status(403).json({ message: 'Host access required' });
    result.board.studentsCanDraw = Boolean(studentsCanDraw);
  } else if (action === 'clear') {
    if (!result.isHost) return res.status(403).json({ message: 'Host access required' });
    result.board.strokes = [];
  } else if (action === 'add') {
    if (!stroke || !stroke.id || !Array.isArray(stroke.points) || stroke.points.length > 2000) {
      return res.status(400).json({ message: 'Invalid whiteboard stroke' });
    }
    if (!result.isHost && !result.board.studentsCanDraw) return res.status(403).json({ message: 'Students cannot draw yet' });
    result.board.strokes.push({
      ...stroke,
      userId: req.user.userId,
      points: stroke.points.map((point) => ({ x: Number(point.x), y: Number(point.y) })),
    });
    if (result.board.strokes.length > 5000) result.board.strokes = result.board.strokes.slice(-5000);
  } else {
    return res.status(400).json({ message: 'Unknown whiteboard action' });
  }
  await result.board.save();
  return res.json({ strokes: result.board.strokes, studentsCanDraw: result.board.studentsCanDraw });
}
