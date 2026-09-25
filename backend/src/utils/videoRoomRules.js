export const TIER_CAP = Object.freeze({
  starter: 25,
  growth: 50,
  pro: 75,
  elite: null,
});

export function hasParticipantCapacity(room, participantCount) {
  return room.maxParticipants == null || participantCount < room.maxParticipants;
}

export function getPeakAttendance(attendees = []) {
  const events = attendees.flatMap((attendee) => {
    if (!attendee.joinedAt) return [];
    return [
      { time: new Date(attendee.joinedAt).getTime(), delta: 1 },
      { time: attendee.leftAt ? new Date(attendee.leftAt).getTime() : Date.now(), delta: -1 },
    ];
  }).sort((left, right) => left.time - right.time || left.delta - right.delta);

  let active = 0;
  let peak = 0;
  for (const event of events) {
    active += event.delta;
    peak = Math.max(peak, active);
  }
  return peak;
}

export function isRemovalBlocked(room, userId, now = new Date()) {
  return (room.removedUsers || []).some((entry) =>
    String(entry.userId) === String(userId)
    && new Date(entry.rejoinBlockedUntil || entry.removedUntil || 0) > now);
}
