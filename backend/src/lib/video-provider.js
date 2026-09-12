const createMockProvider = () => ({
  async createRoom(sessionId) {
    const roomId = `dev-room-${sessionId}-${Math.random().toString(36).slice(2, 10)}`;
    return {
      roomId,
      joinUrlHost: `/session/${sessionId}?role=host`,
      joinUrlStudent: `/session/${sessionId}`,
    };
  },
});

export const videoProvider = createMockProvider();

export async function reserveSessionRoom(session) {
  if (session.roomStatus === 'ready' && session.videoRoomId) return session;
  session.roomStatus = 'pending';
  await session.save();
  try {
    const room = await videoProvider.createRoom(session._id.toString());
    session.videoRoomId = room.roomId;
    session.hostJoinUrl = room.joinUrlHost;
    session.studentJoinUrl = room.joinUrlStudent;
    session.roomStatus = 'ready';
  } catch (error) {
    session.roomStatus = 'pending';
    session.roomError = 'Room preparation is temporarily unavailable.';
    console.error('[video] room reservation failed', error);
  }
  await session.save();
  return session;
}
