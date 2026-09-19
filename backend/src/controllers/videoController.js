import VideoRoom from '../models/VideoRoom.js';
import Session from '../models/Session.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import SessionAudit from '../models/SessionAudit.js';
import SessionWhiteboard from '../models/SessionWhiteboard.js';
import { SessionMessage, SessionPoll } from '../models/SessionEngagement.js';
import Recording from '../models/Recording.js';
import { v4 as uuidv4 } from 'uuid';
import { assertFeature, getHostTier, planGateResponse } from '../utils/plan-limits.js';

const tierCap = { growth: 25, pro: 50, elite: 75 };
const removalReasons = new Set(['Accidental join', 'Disruptive', 'Not enrolled']);
const breakoutDurations = new Set([5, 10, 15]);

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
    const isHost = String(session.classId.hostId) === String(req.user.userId);
    if (!isHost) {
      if (!(await activeEnrollment(req.user.userId, session.classId._id, new Date()))) {
        return res.status(403).json({ code: 'subscription_required', message: 'This class needs an active enrollment' });
      }
      const existingRoom = await VideoRoom.findOne({ sessionId, status: { $ne: 'closed' } });
      if (!existingRoom) return res.status(409).json({ code: 'waiting_for_host', message: 'The host has not opened this class yet' });
      return res.status(200).json({ message: 'Video room ready', videoRoom: existingRoom });
    }
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
    await Session.findByIdAndUpdate(room.sessionId, {
      $push: {
        attendees: {
          userId: req.user.userId,
          email: req.user.email,
          joinedAt: new Date(),
        },
      },
      actualStartTime: room.status === 'active' ? new Date() : undefined,
    });
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
  await Session.updateOne(
    { _id: access.room.sessionId, 'attendees.userId': req.user.userId, 'attendees.leftAt': null },
    { $set: { 'attendees.$[entry].leftAt': new Date() } },
    { arrayFilters: [{ 'entry.userId': req.user.userId, 'entry.leftAt': null }] },
  );
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

export const getSessionSummary = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId, { hostOnly: true });
  if (access.error) return res.status(access.error.status).json(access.error);
  const room = access.room;
  const session = await Session.findById(room.sessionId).lean();
  const [messages, polls, recording] = await Promise.all([
    SessionMessage.countDocuments({ sessionId: room.sessionId }),
    SessionPoll.countDocuments({ sessionId: room.sessionId }),
    Recording.findOne({ sessionId: room.sessionId, hostId: room.hostId }).sort({ createdAt: -1 }).lean(),
  ]);
  const active = room.participants.filter((participant) => !participant.leftAt && !participant.waiting).length;
  const peak = Math.max(active, ...room.participants.map((participant) => participant.leftAt ? 0 : 1));
  const durationSeconds = ((room.closedAt || new Date()) - (session?.actualStartTime || room.createdAt)) / 1000;
  return res.json({
    durationSeconds: Math.max(0, Math.round(durationSeconds)),
    peakParticipants: peak,
    chatMessages: messages,
    pollCount: polls,
    recording: recording ? {
      status: recording.status,
      reviewHoldUntil: recording.reviewHoldUntil,
      releaseAt: recording.releaseAt,
    } : null,
  });
};

export const exportAttendance = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId, { hostOnly: true });
  if (access.error) return res.status(access.error.status).json(access.error);
  const room = access.room;
  const session = await Session.findById(room.sessionId).lean();
  const rows = [['Name', 'Email', 'Joined At', 'Left At', 'Duration Seconds', 'Role']];
  const users = await User.find({ _id: { $in: room.participants.map((participant) => participant.userId) } }).select('firstName lastName email').lean();
  const byId = new Map(users.map((user) => [String(user._id), user]));
  for (const participant of room.participants) {
    const user = byId.get(String(participant.userId)) || {};
    const joined = participant.joinedAt ? new Date(participant.joinedAt) : null;
    const left = participant.leftAt ? new Date(participant.leftAt) : new Date(room.closedAt || Date.now());
    rows.push([
      [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Participant',
      user.email || participant.email || '',
      joined?.toISOString() || '',
      left.toISOString(),
      joined ? Math.max(0, Math.round((left - joined) / 1000)) : 0,
      participant.role || (participant.isHost ? 'host' : 'student'),
    ]);
  }
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="session-attendance-${room.sessionId}.csv"`);
  return res.send(csv);
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

async function requireBreakoutAccess(req, res) {
  const access = await roomAccess(req.params.roomId, req.user.userId, { hostOnly: true });
  if (access.error) return access;
  try {
    await assertFeature(access.room.hostId, 'breakouts');
  } catch (error) {
    planGateResponse(error, res);
    return { error: { status: 403, code: 'plan_gate' } };
  }
  return access;
}

export const getBreakouts = async (req, res) => {
  const access = await roomAccess(req.params.roomId, req.user.userId);
  if (access.error) return res.status(access.error.status).json(access.error);
  try { await assertFeature(access.room.hostId, 'breakouts'); } catch (error) { if (planGateResponse(error, res)) return; throw error; }
  return res.json({ breakoutRooms: access.room.breakoutRooms || [], breakoutState: access.room.breakoutState || { status: 'idle' }, isHost: access.isHost, isCoHost: access.isCoHost });
};

export const updateBreakouts = async (req, res) => {
  const access = await requireBreakoutAccess(req, res);
  if (access.error) return res.status(access.error.status).json(access.error);
  const { action, count, durationMinutes, assignments, announcement } = req.body;
  const room = access.room;
  if (action === 'create') {
    const total = Math.max(2, Math.min(8, Number(count)));
    const duration = Number(durationMinutes);
    if (!Number.isInteger(total) || !breakoutDurations.has(duration)) return res.status(400).json({ message: 'Choose 2–8 rooms and a 5, 10, or 15 minute duration' });
    room.breakoutRooms = Array.from({ length: total }, (_, index) => ({
      name: `Room ${index + 1}`, roomId: `${room.roomId}-breakout-${index + 1}`, durationMinutes: duration, status: 'draft', participantIds: [],
    }));
  } else if (action === 'assign') {
    if (!Array.isArray(assignments)) return res.status(400).json({ message: 'Assignments must be a list' });
    const ids = new Set((room.participants || []).filter((item) => !item.isHost && !item.leftAt).map((item) => String(item.userId)));
    for (const assignment of assignments) {
      const breakout = room.breakoutRooms.id(assignment.breakoutId);
      if (!breakout || !ids.has(String(assignment.userId))) continue;
      room.breakoutRooms.forEach((item) => { item.participantIds = item.participantIds.filter((id) => String(id) !== String(assignment.userId)); });
      breakout.participantIds.push(assignment.userId);
    }
  } else if (action === 'open') {
    if (!room.breakoutRooms?.length) return res.status(409).json({ message: 'Create breakout rooms first' });
    const now = new Date();
    room.breakoutRooms.forEach((item) => { item.status = 'open'; item.openedAt = now; item.closesAt = new Date(now.getTime() + item.durationMinutes * 60000); });
    room.breakoutState = { status: 'open', announcement: '', closeAt: new Date(now.getTime() + Math.max(...room.breakoutRooms.map((item) => item.durationMinutes)) * 60000) };
  } else if (action === 'broadcast') {
    const value = String(announcement || '').trim();
    if (!value || value.length > 300) return res.status(400).json({ message: 'Announcement must be between 1 and 300 characters' });
    room.breakoutState.announcement = value;
  } else if (action === 'close') {
    const closeAt = new Date(Date.now() + 30000);
    room.breakoutState = { ...(room.breakoutState?.toObject?.() || room.breakoutState || {}), status: 'closing', closeAt };
    room.breakoutRooms.forEach((item) => { if (item.status === 'open') { item.status = 'closing'; item.closingAt = closeAt; } });
  } else if (action === 'finish_close') {
    room.breakoutState = { status: 'idle', announcement: '', closeAt: null };
    room.breakoutRooms.forEach((item) => { item.status = 'closed'; });
  } else return res.status(400).json({ message: 'Unsupported breakout action' });
  await room.save();
  await audit(room, req.user.userId, `breakout_${action}`, null, undefined, { count: room.breakoutRooms.length });
  return res.json({ breakoutRooms: room.breakoutRooms, breakoutState: room.breakoutState });
};
