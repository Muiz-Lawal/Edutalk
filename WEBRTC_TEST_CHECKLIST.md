# WebRTC Implementation Test Checklist

## Pre-Test Setup

- [ ] Backend running: `npm run dev` in backend folder (should see Socket.io listening)
- [ ] Frontend running: `npm run dev` in frontend folder (should be on localhost:5173)
- [ ] MongoDB running and accessible
- [ ] Two browser windows/tabs open (can be different browsers)
- [ ] Dev Tools open in at least one window (F12)
- [ ] Console tab visible in Dev Tools

## Two-Person Conference Test

### Setup Phase

- [ ] User A logs in, navigates to active class
- [ ] User A clicks "Start Session" or enters video room
- [ ] Video consent popup appears, click "Allow"
- [ ] Local video feed appears (should be mirrored)
- [ ] Status shows "Connected (1 participant)" or "Waiting for participants"
- [ ] Console shows: "✓ Connected to signaling server"

### Join Second User

- [ ] User B logs in (different browser/tab), enters same room
- [ ] User B allows camera/mic access
- [ ] Console (User A) shows: "New user joined: socketXXX"
- [ ] Console (User B) shows: "Existing participants: [{socketId: ...}]"
- [ ] Both users see "Connected (2 participants)"

### Video Connectivity

- [ ] User A can see User B's video in grid
- [ ] User B can see User A's video in grid
- [ ] User A's local video has blue border
- [ ] User B's local video has blue border
- [ ] Both videos are live (show head movement, facial changes)
- [ ] No lag or freezing (30 FPS preferred)
- [ ] Console shows NO errors about RTCPeerConnection

### Audio Testing

- [ ] User A speaks, User B hears audio
- [ ] User B speaks, User A hears audio
- [ ] Audio is clear (no distortion, static, or echo)
- [ ] Volume levels are balanced
- [ ] No microphone feedback loop

### Control Testing

- [ ] Audio mute button (🎤) works for both users
  - [ ] When muted, other user doesn't hear anything
  - [ ] Button changes appearance when muted
- [ ] Video toggle button (🎥) works
  - [ ] When disabled, black screen for other user
  - [ ] Button changes appearance when disabled
- [ ] Screen share (📺) button works
  - [ ] Click triggers "Select screen" dialog
  - [ ] Can select screen/window
  - [ ] Other user sees screen instead of camera
  - [ ] "Stop" button appears and works

### Stats Monitoring

- [ ] Bitrate visible in top-right of video tiles (e.g., "1200 kbps")
- [ ] Bitrate updates every 2 seconds
- [ ] Connection status indicator shows green dot (pulsing)
- [ ] Console shows WebRTC stats collection (search for "kbps")

### Chat Testing

- [ ] User A types message in chat, hits Enter
- [ ] Message appears in both users' chat windows
- [ ] User B's name shows correctly
- [ ] Timestamp is recent
- [ ] Messages don't get moderation-blocked (check console)

### End Session

- [ ] User A clicks "Leave" button
- [ ] User A's video disappears for User B
- [ ] User B still sees "Connected (1 participant)"
- [ ] User A's browser shows confirmation or goes back to class
- [ ] User B can continue or leave as well
- [ ] Console shows: "User left: socketXXX"

---

## Three-Person Conference Test

### Setup Phase

- [ ] Third browser window opens, User C logs in
- [ ] User C enters same room
- [ ] All three users see each other
- [ ] Status shows "Connected (3 participants)"
- [ ] Grid shows 3 video tiles

### Verification

- [ ] User A sees B and C
- [ ] User B sees A and C
- [ ] User C sees A and B
- [ ] All three can see each other's local streams (mirrored)
- [ ] All three can hear each other
- [ ] Console shows 2 peer connections per user (N-1 where N=3)
  - User A: connection to B, connection to C
  - User B: connection to A, connection to C
  - User C: connection to A, connection to B

### Multi-Party Audio

- [ ] User A speaks, B and C both hear
- [ ] User B speaks, A and C both hear
- [ ] User C speaks, A and B both hear
- [ ] 2+ users can speak simultaneously (no crosstalk issues)
- [ ] Audio mixing happens in browser (not server-side)

### Network Adaptation

- [ ] With normal bandwidth: bitrate ~1200+ kbps per connection
- [ ] Open DevTools Network tab
- [ ] Throttle to "Slow 3G"
- [ ] Bitrate drops to ~400-600 kbps
- [ ] Video resolution decreases but still visible
- [ ] Connection doesn't break
- [ ] Remove throttling, bitrate returns to normal

---

## Error Handling Test

### Browser Compatibility

- [ ] Works in Chrome (primary test)
- [ ] Works in Firefox (if available)
- [ ] Works in Safari/Edge (if available)

### Permission Handling

- [ ] Denying camera permission shows error
- [ ] Denying microphone permission shows error
- [ ] Error message is user-friendly
- [ ] Can retry without page reload

### Network Failures

- [ ] Disconnect WiFi → connection shows "Disconnected" (red indicator)
- [ ] Reconnect WiFi → automatically reconnects (TODO: not yet implemented)
- [ ] Kill backend server → Socket disconnect event fires
- [ ] Restart backend → can rejoin room

### Edge Cases

- [ ] User A leaves → User B still connected, can chat
- [ ] User B then leaves → Room is empty (but still exists)
- [ ] User C joins empty room → Sees "Waiting for participants"
- [ ] User A rejoins → C can see A again
- [ ] Browser tab closed → Graceful cleanup, no "phantom" participants

---

## Console Validation

### Expected Console Logs

```
✓ Connected to signaling server
✓ Existing participants: [...]
✓ Received offer from: socketXXX
✓ Answer sent to: socketXXX
✓ ICE connection state with socketXXX: connected
✓ Received remote stream from: socketXXX
✓ Connection state with socketXXX: connected
```

### Should NOT See

```
✗ Error adding ICE candidate
✗ Error creating offer
✗ Error handling offer
✗ Error handling answer
✗ RTCError
✗ NotAllowedError (except for screen share cancellation)
```

---

## Performance Metrics

### Baseline (2-person on 100 Mbps WiFi)

- [ ] Time to connect: <5 seconds
- [ ] First video appearance: <2 seconds
- [ ] Audio latency: <100ms
- [ ] CPU usage: <10% per user
- [ ] Memory: ~30-50 MB per connection
- [ ] Bitrate: 1200-2000 kbps

### Slow Network (Throttled to 3G)

- [ ] Time to connect: <10 seconds
- [ ] Video still visible but lower resolution
- [ ] Audio remains clear
- [ ] No packet loss (or <1%)
- [ ] Graceful degradation

---

## Sign-Off

### Tester Information

- [ ] Tester Name: **\*\*\*\***\_**\*\*\*\***
- [ ] Test Date: **\*\*\*\***\_**\*\*\*\***
- [ ] Browser(s) Tested: **\*\*\*\***\_**\*\*\*\***
- [ ] OS: **\*\*\*\***\_**\*\*\*\***

### Results

- [ ] All tests passed
- [ ] Some tests failed (document below)
- [ ] Critical issues found

### Failed Tests (if any)

```
Issue #1: ___________________
Expected: ___________________
Actual: ___________________

Issue #2: ___________________
Expected: ___________________
Actual: ___________________
```

### Approval

- [ ] Ready for staging deployment
- [ ] Needs fixes before deployment
- [ ] Ready for production

---

## Quick Test Script (CLI Testing)

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Look for: "Socket.io server listening on port 5000"

# Terminal 2: Start frontend
cd frontend
npm run dev
# Look for: "Local: http://localhost:5173"

# Browser 1: Login, start session
# Should see: "Connected to signaling server" ✓

# Browser 2: Login, enter same room
# Both should show 2 participants ✓

# Verify in Console (F12 → Console tab):
# grep "Connection state with" = 3 logs minimum (offer, answer, connection established)
```

---

## Known Issues Tracker

| Issue                              | Severity | Status          | Notes                                     |
| ---------------------------------- | -------- | --------------- | ----------------------------------------- |
| No reconnection on network failure | Medium   | TODO            | Placeholder in code (line 339)            |
| Speaker detection not implemented  | Low      | TODO            | Will highlight active speaker             |
| TURN servers not configured        | Medium   | Production-only | Using STUN only (good for LAN)            |
| No bandwidth adaptation algorithm  | Medium   | TODO            | Currently shows bitrate but doesn't adapt |

---

## Success Criteria

✅ **PASS** if:

- Two users can video call without errors
- Three users can video call simultaneously
- Audio is clear with minimal latency
- Video quality adapts to bandwidth
- No console errors or warnings
- All controls (mute, video, screen share) work
- Chat works with AI moderation

❌ **FAIL** if:

- Connection fails to establish
- One-way video (only one user sees the other)
- Audio is distorted or delayed
- Frequent disconnections
- Console errors prevent functionality
- Controls don't respond

---

**Test Status:** Ready for testing  
**Last Updated:** 2026-05-24
