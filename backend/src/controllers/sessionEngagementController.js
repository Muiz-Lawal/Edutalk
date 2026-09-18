import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import { SessionMessage, SessionQuestion, SessionPoll, SessionHand } from '../models/SessionEngagement.js';

async function context(req, sessionId) {
  const session = await Session.findById(sessionId).populate('classId', 'hostId');
  if (!session) return { error: { status: 404, message: 'Session not found' } };
  const isHost = String(session.classId.hostId) === String(req.user.userId);
  const enrolled = isHost || await Subscription.exists({
    userId: req.user.userId,
    classId: session.classId._id,
    status: 'active',
  });
  if (!enrolled) return { error: { status: 403, code: 'subscription_required', message: 'This class needs an active enrollment' } };
  return { session, isHost };
}

const safeUser = (user) => ({ id: user._id, name: [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Participant', avatar: user.avatar });

export async function getEngagement(req, res) {
  const { sessionId } = req.params;
  const access = await context(req, sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  const [messages, questions, poll, hands] = await Promise.all([
    SessionMessage.find({ sessionId }).populate('userId', 'firstName lastName avatar').sort({ createdAt: 1 }).limit(200),
    SessionQuestion.find({ sessionId }).populate('userId', 'firstName lastName avatar').sort({ status: 1, createdAt: 1 }),
    SessionPoll.findOne({ sessionId, status: 'live' }),
    SessionHand.find({ sessionId, loweredAt: null }).populate('userId', 'firstName lastName avatar').sort({ raisedAt: 1 }),
  ]);
  return res.json({
    chatEnabled: access.session.chatEnabled !== false,
    messages: messages.map((item) => ({ ...item.toObject(), user: safeUser(item.userId), userId: item.userId._id })),
    questions: questions.map((item) => ({ ...item.toObject(), user: safeUser(item.userId), userId: item.userId._id, voteCount: item.upvotes.length })),
    poll,
    hands: hands.map((item) => ({ id: item._id, user: safeUser(item.userId), raisedAt: item.raisedAt })),
    isHost: access.isHost,
  });
}

export async function createMessage(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (access.session.chatEnabled === false) return res.status(409).json({ code: 'chat_disabled', message: 'The host disabled chat' });
  const text = String(req.body.text || '').trim();
  if (!text || text.length > 500) return res.status(400).json({ message: 'Messages must be between 1 and 500 characters' });
  const user = await User.findById(req.user.userId).select('firstName lastName avatar');
  const message = await SessionMessage.create({ sessionId: req.params.sessionId, userId: req.user.userId, text, isHost: access.isHost });
  return res.status(201).json({ ...message.toObject(), user: safeUser(user) });
}

export async function deleteMessage(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Host access required' });
  const message = await SessionMessage.findOneAndUpdate({ _id: req.params.messageId, sessionId: req.params.sessionId }, { deletedAt: new Date(), text: 'Message removed by host' }, { new: true });
  if (!message) return res.status(404).json({ message: 'Message not found' });
  return res.json(message);
}

export async function toggleChat(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Host access required' });
  access.session.chatEnabled = Boolean(req.body.enabled);
  await access.session.save();
  return res.json({ chatEnabled: access.session.chatEnabled });
}

export async function createQuestion(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  const text = String(req.body.text || '').trim();
  if (!text || text.length > 500) return res.status(400).json({ message: 'Questions must be between 1 and 500 characters' });
  const question = await SessionQuestion.create({ sessionId: req.params.sessionId, userId: req.user.userId, text });
  return res.status(201).json(question);
}

export async function voteQuestion(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  const question = await SessionQuestion.findOneAndUpdate({ _id: req.params.questionId, sessionId: req.params.sessionId, upvotes: { $ne: req.user.userId } }, { $addToSet: { upvotes: req.user.userId } }, { new: true });
  if (!question) return res.status(409).json({ message: 'You already voted for this question' });
  return res.json({ ...question.toObject(), voteCount: question.upvotes.length });
}

export async function updateQuestion(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Host access required' });
  const question = await SessionQuestion.findOneAndUpdate({ _id: req.params.questionId, sessionId: req.params.sessionId }, { status: req.body.status }, { new: true });
  return res.json(question);
}

export async function createPoll(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Host access required' });
  if (await SessionPoll.exists({ sessionId: req.params.sessionId, status: 'live' })) return res.status(409).json({ message: 'End the current poll first' });
  const options = Array.isArray(req.body.options) ? req.body.options.map((label) => ({ label: String(label).trim() })).filter((item) => item.label).slice(0, 5) : [];
  if (!req.body.question || options.length < 2) return res.status(400).json({ message: 'A poll needs a question and at least two options' });
  const poll = await SessionPoll.create({ sessionId: req.params.sessionId, hostId: req.user.userId, question: String(req.body.question).trim(), options, anonymous: Boolean(req.body.anonymous), status: 'live' });
  return res.status(201).json(poll);
}

export async function votePoll(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  const poll = await SessionPoll.findOneAndUpdate({ _id: req.params.pollId, sessionId: req.params.sessionId, status: 'live', voters: { $ne: req.user.userId }, 'options._id': req.body.optionId }, { $inc: { 'options.$.votes': 1 }, $addToSet: { voters: req.user.userId } }, { new: true });
  if (!poll) return res.status(409).json({ message: 'You already voted or this poll is unavailable' });
  return res.json(poll);
}

export async function updatePoll(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Host access required' });
  const update = req.body.action === 'share' ? { resultsShared: true } : { status: 'ended' };
  const poll = await SessionPoll.findOneAndUpdate({ _id: req.params.pollId, sessionId: req.params.sessionId }, update, { new: true });
  return res.json(poll);
}

export async function raiseHand(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  const existing = await SessionHand.findOne({ sessionId: req.params.sessionId, userId: req.user.userId, loweredAt: null });
  if (existing) return res.status(409).json({ message: 'Your hand is already raised' });
  const hand = await SessionHand.create({ sessionId: req.params.sessionId, userId: req.user.userId });
  const user = await User.findById(req.user.userId).select('firstName lastName avatar');
  return res.status(201).json({ id: hand._id, user: safeUser(user), raisedAt: hand.raisedAt });
}

export async function lowerHand(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  const hand = await SessionHand.findOneAndUpdate(
    { _id: req.params.handId, sessionId: req.params.sessionId },
    { loweredAt: new Date() },
    { new: true }
  );
  if (!hand) return res.status(404).json({ message: 'Hand not found' });
  return res.json({ success: true });
}

export async function exportPollCsv(req, res) {
  const access = await context(req, req.params.sessionId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Host access required' });
  const poll = await SessionPoll.findOne({ _id: req.params.pollId, sessionId: req.params.sessionId });
  if (!poll) return res.status(404).json({ message: 'Poll not found' });
  const rows = [['Question', poll.question], ['Anonymous', poll.anonymous ? 'Yes' : 'No'], []];
  rows.push(['Option', 'Votes', ...(poll.anonymous ? [] : ['Responses'])]);
  for (const option of poll.options) {
    const votes = poll.voteDetails?.filter((v) => String(v.optionId) === String(option._id)) || [];
    rows.push([option.label, option.votes, ...(poll.anonymous ? [] : [votes.map((v) => v.userId).join('; ')])]);
  }
  const csv = rows.map((row) => row.map((cell) => (String(cell).includes(',') || String(cell).includes('"') ? `"${String(cell).replace(/"/g, '""')}"` : cell)).join(',')).join('\n');
  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename="poll-${req.params.pollId}.csv"`);
  return res.send(csv);
}
