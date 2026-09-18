import VideoRoom from '../models/VideoRoom.js';
import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import SessionAudit from '../models/SessionAudit.js';
import SessionWhiteboard from '../models/SessionWhiteboard.js';
import { v4 as uuidv4 } from 'uuid';
import { assertFeature, getHostTier, planGateResponse } from '../utils/plan-limits.js';

const tierCap = { growth: 25, pro: 50, elite: 75 };
const removalReasons = new Set(['Accidental join', 'Disruptive', 'Not enrolled']);

async function roomAccess(roomId, userId, { hostOnly = false } = {}) {
  const room = await VideoRoom.findOne({ roomId });
  if (!room) return { error: { status: 404, message: 'Video room not found' } };
  const isHost = String(room.hostId) === String(userId);
  const isCoHost = (room.coHosts || []).some((id) => String(id) === String(userId));
  if (hostOnly && !isHost && !isCoHost) return { error: { status: 403, message: 'Host access required' } };
  return { room, isHost, isCoHost };
}

async function audit(room, actorId, action, targetId, reason, metadata) {
  await SessionAudit.create({ sessionId: room.sessionId, roomId: room.roomId, actorId, targetId, action, reason, metadata });
}

async function activeEnrollment(userId, classId, sessionDate) {
  const date = sessionDate || new Date();
  return Subscription.exists({
    userId, classId, status: 'active',
    $or: [
      { startDate: { $exists: false } },
      { startDate: { $lte: date }, endDate: { $gte: date } },
      { startDate: { $lte: date }, endDate: null },
    ],
  });
}

async function authorizedViewer(room, userId) {
  const host = String(room.hostId) === String(userId);
  const coHost = (room.coHosts || []).some((id) => String(id) === String(userId));
  return host || coHost || Boolean(await activeEnrollment(userId, room.classId, new Date()));
}

export const createVideoRoom = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await Session.findById(sessionId).populate('classId', 'hostId videoMode');
    if (!session || !session.classId) return res.status(404).json({ message: 'Session not found' });
    if (session.classId.videoMode !== 'builtin') return res.status(403).json({ message: 'Built-in video is not enabled for this class' });
    if (String(session.classId.hostId) !== String(req.user.userId)) return res.status(403).json({ message: 'Only the class host can create the room' });
    try { await assertFeature(req.user.userId, 'builtinVideo'); } catch (error) {
      if (planGateResponse(error, res)) return;
      return res.status(500).json({ message: 'Unable to create video room.' });
    }
    const existing = await VideoRoom.findOne({ sessionId, status: { $ne: 'closed' } });
    if (existing) return res.status(200).json({ message: 'Video room ready', videoRoom: existing });
    const tier = await getHostTier(req.user.userId);
    const room = await VideoRoom.create({
      classId: session.classId._id,
      sessionId,
      roomId: `room-${uuidv4()}`,
      hostId: req.user.userId,
      status: 'created',
      maxParticipants: tierCap[tier] || 25,
      waitingRoomEnabled: true,
      presenterId: req.user.userId,
    });
    return res.status(201).json({ message: 'Video room created', videoRoom: room });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create video room.' });
  }
};

export const getVideoRoomToken = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!(await authorizedViewer(access.room, req.user.userId))) return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
  return res.json({
    token: Buffer.from(JSON.stringify({
      roomId: access.room.roomId, userId: req.user.userId.toString(), email: req.user.email,
      isHost: access.isHost, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
    })).toString('base64'),
    videoRoom: access.room,
  });
};

export const joinVideoRoom = async (req, res) => {
  try {
    const access = await roomAccess(req.body.roomId, req.user.userId);
    if (access.error) return res.status(access.error.status).json(access.error);
    const { room, isHost, isCoHost } = access;
    if (room.status === 'closed') return res.status(409).json({ message: 'This class has ended' });
    const removed = room.removedUsers.find((entry) => String(entry.userId) === String(req.user.userId) && entry.removedUntil > new Date());
    if (removed) return res.status(403).json({ code: 'removed_from_class', message: 'The host removed you from this class' });
    if (!isHost && !isCoHost && !(await activeEnrollment(req.user.userId, room.classId, new Date()))) {
      return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
    }
    const current = room.participants.find((entry) => String(entry.userId) === String(req.user.userId) && !entry.leftAt);
    if (current) return res.json({ message: current.waiting ? 'Waiting for host admission' : 'Already joined', waiting: current.waiting, videoRoom: room });
    const currentCount = room.participants.filter((entry) => !entry.leftAt && !entry.waiting).length;
    if (!isHost && !isCoHost && currentCount >= room.maxParticipants) return res.status(409).json({ code: 'class_full', message: 'This class is full' });
    const waiting = !isHost && !isCoHost && room.waitingRoomEnabled;
    room.participants.push({
      userId: req.user.userId, email: req.user.email, joinedAt: new Date(),
      isHost, role: isHost ? 'host' : isCoHost ? 'cohost' : 'student',
      waiting, admittedAt: waiting ? null : new Date(),
    });
    room.status = 'active';
    await room.save();
    return res.status(waiting ? 202 : 200).json({ message: waiting ? 'Waiting for host admission' : 'Joined video room', waiting, videoRoom: room });
  } catch {
    return res.status(500).json({ message: 'Unable to join this class.' });
  }
};

export const leaveVideoRoom = async (req, res) => {
  const access = await roomAccess(req.body.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!(await authorizedViewer(access.room, req.user.userId))) return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
  await VideoRoom.updateOne({ _id: access.room._id, 'participants.userId': req.user.userId }, { $set: { 'participants.$[entry].leftAt': new Date() } }, { arrayFilters: [{ 'entry.userId': req.user.userId, 'entry.leftAt': null }] });
  return res.json({ message: 'Left video room' });
};

export const closeVideoRoom = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!access.isHost) return res.status(403).json({ message: 'Only the host can end the class' });
  access.room.status = 'closed';
  access.room.closedAt = new Date();
  await access.room.save();
  await Session.findByIdAndUpdate(access.room.sessionId, { status: 'completed', actualEndTime: access.room.closedAt });
  await SessionWhiteboard.deleteOne({ sessionId: access.room.sessionId });
  return res.json({ message: 'Video room closed', videoRoom: access.room });
};

export const getVideoRoomStats = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!(await authorizedViewer(access.room, req.user.userId))) return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
  const room = access.room;
  return res.json({
    roomId: room.roomId, status: room.status,
    participantCount: room.participants.filter((p) => !p.leftAt && !p.waiting).length,
    totalParticipants: room.participants.length,
    duration: ((room.closedAt || new Date()) - room.createdAt) / 1000,
    participants: room.participants.map((p) => ({ email: p.email, joinedAt: p.joinedAt, leftAt: p.leftAt, duration: p.leftAt ? (p.leftAt - p.joinedAt) / 1000 : null, isHost: p.isHost, waiting: p.waiting })),
  });
};

export const getCommandCenter = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!(await authorizedViewer(access.room, req.user.userId))) return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
  const users = await User.find({ _id: { $in: access.room.participants.map((p) => p.userId) } }).select('firstName lastName avatar');
  const byId = new Map(users.map((user) => [String(user._id), user]));
  const format = (participant) => ({ ...participant.toObject(), user: byId.get(String(participant.userId)) });
  return res.json({ videoRoom: access.room, participants: access.room.participants.filter((p) => !p.waiting && !p.leftAt).map(format), waiting: access.room.participants.filter((p) => p.waiting && !p.leftAt).map(format), isHost: access.isHost, isCoHost: access.isCoHost });
};

export const getRoomState = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  if (!(await authorizedViewer(access.room, req.user.userId))) return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
  const participant = access.room.participants.find((entry) => String(entry.userId) === String(req.user.userId) && !entry.leftAt);
  return res.json({
    status: access.room.status,
    locked: access.room.locked,
    waitingRoomEnabled: access.room.waitingRoomEnabled,
    waiting: Boolean(participant?.waiting),
    admitted: Boolean(participant && !participant.waiting),
    presenterId: access.room.presenterId,
  });
};

export const updateRoomControl = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId, { hostOnly: true });
  if (access.error) return res.status(access.error.status).json(access.error);
  const { action, targetUserId, reason } = req.body;
  const room = access.room;
  if (!access.isHost && ['lock', 'waiting_room', 'cohost'].includes(action)) return res.status(403).json({ message: 'Only the host can change room security or co-hosts' });
  const target = targetUserId && room.participants.find((p) => String(p.userId) === String(targetUserId) && !p.leftAt);
  if (['admit', 'remove', 'mute', 'stop_camera', 'presenter', 'cohost'].includes(action) && !target) return res.status(404).json({ message: 'Participant not found' });
  if (action === 'admit') {
    if (room.locked) return res.status(409).json({ code: 'room_locked', message: 'The room is locked' });
    if (room.participants.filter((p) => !p.leftAt && !p.waiting).length >= room.maxParticipants) return res.status(409).json({ code: 'class_full', message: 'This class is full' });
    target.waiting = false; target.admittedAt = new Date();
  } else if (action === 'admit_all') {
    if (room.locked) return res.status(409).json({ code: 'room_locked', message: 'The room is locked' });
    const available = room.maxParticipants - room.participants.filter((p) => !p.leftAt && !p.waiting).length;
    room.participants.filter((p) => p.waiting && !p.leftAt).slice(0, available).forEach((p) => { p.waiting = false; p.admittedAt = new Date(); });
  } else if (action === 'remove') {
    if (!removalReasons.has(reason)) return res.status(400).json({ message: 'Choose a removal reason' });
    target.leftAt = new Date(); target.removedAt = new Date();
    room.removedUsers.push({ userId: target.userId, removedUntil: new Date(Date.now() + 60 * 1000) });
  } else if (action === 'mute') target.audioEnabled = false;
  else if (action === 'stop_camera') target.videoEnabled = false;
  else if (action === 'presenter') room.presenterId = target.userId;
  else if (action === 'cohost') {
    if (!access.isHost) return res.status(403).json({ message: 'Only the host can manage co-hosts' });
    try { await assertFeature(room.hostId, 'coHost'); } catch (error) { if (planGateResponse(error, res)) return; throw error; }
    if (!room.coHosts.some((id) => String(id) === String(target.userId))) room.coHosts.push(target.userId);
    target.role = 'cohost';
  } else if (action === 'lock') room.locked = Boolean(req.body.value);
  else if (action === 'waiting_room') room.waitingRoomEnabled = Boolean(req.body.value);
  else return res.status(400).json({ message: 'Unsupported room action' });
  await room.save();
  if (targetUserId) await audit(room, req.user.userId, action, targetUserId, reason);
  return res.json({ videoRoom: room });
};
