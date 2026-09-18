# Engagement & Whiteboard Acceptance Tests

## Overview
Comprehensive test cases for the authenticated session room (`/session/[id]`), engagement layer (chat, Q&A, reactions, hands, polls), and collaborative whiteboard.

---

## 1. SESSION ROOM CORE

### 1.1 Authentication & Access Control
- [ ] **Starter host**: Cannot join built-in room; external link shown; no green room
- [ ] **Growth+ host**: Green room shown; can join and enter lobby/room
- [ ] **Student without active subscription**: Room entry blocked with friendly "This class needs an active enrollment" + "View class" button; no provider room created
- [ ] **Student with active subscription**: Green room shown; can join; lands in lobby until host admits/class starts

### 1.2 Green Room & Device Selection
- [ ] Camera preview renders with live stream
- [ ] Microphone level meter animates with input
- [ ] Device dropdowns (camera, mic, speaker) populate correctly and switch hot
- [ ] "Join without camera" works; camera starts off, mic on
- [ ] "Join class" enters the room
- [ ] Permission denied error shown with browser-specific steps (Safari/Chrome/Edge)

### 1.3 Lobby / Waiting Room
- [ ] Student joins lobby with camera preview (small) and mic/camera toggles
- [ ] Lobby shows class title and "Hosted by [name]"
- [ ] Student can toggle mic/camera before entering
- [ ] Cancel button routes back to dashboard
- [ ] Host entering alone enters room immediately (no lobby)

### 1.4 Layouts (Persistent)
- [ ] **Spotlight** (default): Host/active speaker large (16:9), students filmstrip bottom
- [ ] **Grid**: Responsive grid, max 24 tiles/page with pagination; switch preserves state across refresh
- [ ] **Sidebar**: Content area large (whiteboard), participants stacked right 200px wide
- [ ] Active speaker auto-spotlights when host silent >3s (toggleable in settings)
- [ ] Switching layouts preserves participant state and tiles

### 1.5 Participant Tiles
- [ ] **Components**: Avatar (initials 28px) OR video feed (cover-fit), name chip (13px/600), time chip, indicators
- [ ] **Indicators**:
  - Speaking: emerald ring (2px)
  - Muted mic: rose MicOff chip top-right
  - Hand raised: amber Hand icon top-left
  - Quality: 3-bar Signal (green/amber/rose) top-right
  - Host: indigo "HOST" pill (11px)
- [ ] Pin menu: "Pin for me" hovers and works
- [ ] Audio-only fallback: initials avatar on #1F2937

### 1.6 Resilience & Connection States
- [ ] Reconnecting: amber "Reconnecting…" pill pulsing at top-center
- [ ] Connection unstable: Network icon + "Your connection is unstable"
- [ ] Auto-reconnect: Socket reconnects; mic/camera state restored to pre-disconnect
- [ ] Device switch mid-call: Switch works hot without stopping stream

---

## 2. CONTROLS BAR (Exact Order)

### 2.1 Layout
- [ ] Fixed bottom, centered pill (bg #1F2937/95, radius 16, padding 8px 12px, shadow-xl)
- [ ] Buttons: 48px circles, icon 20px, label 11px underneath
- [ ] Hover: bg rgba(255,255,255,0.08); active/armed: indigo bg

### 2.2 Microphone Toggle (M)
- [ ] Icon: Mic/MicOff; label "Microphone"
- [ ] Click toggles audio and local tile indicator
- [ ] Keyboard shortcut M works (not in inputs)

### 2.3 Camera Toggle (V)
- [ ] Icon: Camera/CameraOff; label "Camera"
- [ ] Click toggles video and tile rendering
- [ ] Keyboard shortcut V works

### 2.4 Screen Share (C, MonitorUp icon)
- [ ] Label: "Share"
- [ ] First click opens system picker; second click stops sharing
- [ ] System/tab audio toggle included
- [ ] Screen stream shows in participants list

### 2.5 Whiteboard (Presentation icon)
- [ ] Label: "Whiteboard"
- [ ] Clicking toggles whiteboard visibility in Sidebar layout (docks left)
- [ ] Grid/Spotlight: opens centered modal 80vw × 80vh
- [ ] State persists across button toggles
- [ ] Keyboard: no shortcut intercepts Whiteboard (placeholder)

### 2.6 Recording Toggle (Pro/Elite gating)
- [ ] **Growth host**: Disabled button with icon ghost appearance; click opens "Recording is a Pro feature" modal with tier upsell
- [ ] **Pro/Elite host**: Active toggle; armed when recording
- [ ] Label: "Record"; timer displays MM:SS format (tabular-nums)
- [ ] Recording state persists across reconnects

### 2.7 Reactions (Smile icon)
- [ ] Label: "Reactions"
- [ ] Popover: fixed six emoji (👍 ❤️ 😂 🎉 👏 💡) + "Raise hand" row
- [ ] Click reaction: floats up sender's tile (2s animation, 28px); appears next to name chip
- [ ] Throttle: 1 per 4s per user (client-side cosmetic; server can validate)
- [ ] No emoji in chrome controls (only user content)

### 2.8 Raise Hand (R, Hand icon)
- [ ] Label: "Raise hand"; toggle on/off
- [ ] Raised: amber Hand chip on tile; added to host's hand queue (Participants panel)
- [ ] Own hand: toggle clears it
- [ ] Host lower: clears chip for that user

### 2.9 Chat (C, PanelRight icon)
- [ ] Label: "Chat"; unread badge shows count (e.g. "Chat (3)")
- [ ] Click opens engagement rail
- [ ] Keyboard shortcut C toggles

### 2.10 Participants Badge
- [ ] Label: "Participants"; count shown (e.g. "Participants (8)")
- [ ] Amber dot when hand(s) raised

### 2.11 Leave / End
- [ ] **Student**: Single "Leave" button; routes to class page; toast "You left the class"
- [ ] **Host split button**:
  - "Leave" (outline)
  - "End for all" (rose)
- [ ] End for all modal: centered, lists counts ("{n} students will be disconnected"), not inline Yes/No
- [ ] Confirm ends session for everyone; routes to class page

---

## 3. ENGAGEMENT RAIL (320px, #111827, border-l #1F2937)

### 3.1 Layout & Responsiveness
- [ ] **≥768px**: Fixed right rail (320px wide), from top below topbar to above controls
- [ ] **<768px**: Overlay sheet sliding from right (min(320px, 90vw) wide), backdrop, Esc closes
- [ ] Rail tabs: Chat | Q&A | Participants (placeholder)
- [ ] Close button (X) on tab bar

### 3.2 Chat Tab

#### 3.2.1 Message Display
- [ ] Avatar initials 28px + name 13px/600 + "HOST" pill (where applicable)
- [ ] Time 11px #94A3B8 (right-aligned)
- [ ] Own messages: right-aligned, indigo surface
- [ ] Text: 14px, links auto-linked, line breaks preserved
- [ ] "Message removed by host" (13px italic #94A3B8, no menu)

#### 3.2.2 History & Unread
- [ ] Mid-class joiners see full history + "New messages" divider
- [ ] Unread badge counts and clears when Chat tab opened
- [ ] Reloading restores unread state

#### 3.2.3 Composer
- [ ] Auto-growing textarea (max 4 rows)
- [ ] Enter sends; Shift+Enter = newline
- [ ] 500-char cap; counter at 450+ ("450/500")
- [ ] Disabled state while reconnecting: "Chat is reconnecting…" (never dead silence)

#### 3.2.4 Host Moderation
- [ ] Per-message menu (⋯): Delete option
- [ ] Delete opens confirm modal (never inline Yes/No); replaces text with "Message removed by host" (13px italic #94A3B8)
- [ ] Deletion audited (AuditLog / event tracking)
- [ ] Chat toggle (host only): "Disable chat" button in header
- [ ] Chat disabled: students see empty state "The host disabled chat"
- [ ] Chat disabled: message composer not shown
- [ ] Students cannot post when chat disabled (server rejects)

### 3.3 Q&A Tab

#### 3.3.1 Question Submission
- [ ] Students: "Ask a question" field; submit button
- [ ] Max 500 chars
- [ ] Questions appear as cards

#### 3.3.2 Question Display
- [ ] Each card: question text, upvote button + count, answer status
- [ ] Upvote icon: ArrowBigUp (lucide), 13px count
- [ ] Host sees queue sorted by votes (descending)
- [ ] Host has "Mark answered" and "Dismiss" actions per question
- [ ] Answered cards: collapsed gray; hide from "open" list
- [ ] Tab label shows answered count (e.g. "Q&A (5)" for 5 answered)

#### 3.3.3 Voting
- [ ] One vote per user per question (server enforces $ne condition)
- [ ] Double vote rejected: "You already voted for this question"
- [ ] Vote count updates in real-time (optimistic UI)

### 3.4 Participants Tab (Placeholder)
- [ ] Renders participant list (name, hand raised indicator)
- [ ] Hands queue shows in raise order
- [ ] Host has "Lower" action per raised hand
- [ ] Tab shows "(2)" badge for 2 hands raised

### 3.5 Error & Loading States
- [ ] Loading: skeleton shimmer (2-3 lines)
- [ ] Error banner: friendly text + "Retry" button (never raw API error)
- [ ] Disconnect: "Chat is reconnecting…" in composer; no silent failure

---

## 4. WHITEBOARD

### 4.1 Availability & Modes
- [ ] Built-in classrooms only (external link hosts do not see whiteboard)
- [ ] Non-tier-gated: all Growth+ hosts can access
- [ ] Docked in Sidebar layout; modal (80vw × 80vh) in Grid/Spotlight

### 4.2 Toolbar (top-left, dark chrome)
- [ ] **Tools**: Select | Pen | Marker | Eraser | Shapes | Text | Sticky | Undo/Redo | Clear
- [ ] **Colors**: 6 swatches (white, indigo-500, emerald-500, amber-500, rose-500, slate-400)
- [ ] **Thickness**: 3 sizes (2px, 5px, 10px)
- [ ] Active tool/color/width highlighted
- [ ] Touch: tap targets ≥40px; palm rejection (pen + single-finger draw)

### 4.3 Host Controls (top-right)
- [ ] **Students can draw**: Toggle (default OFF = view-only)
- [ ] View-only: toolbar hidden; cursor labeled with host name; fades after 3s idle
- [ ] When ON: everyone draws with named cursors (13px labels, color per user)
- [ ] **Clear board**: Centered confirm modal; empties all clients
- [ ] **Export PNG**: Downloads to user device; saves to class resources with timestamp
- [ ] Close button (host only)

### 4.4 Drawing & Persistence
- [ ] Two browsers: host draws, student sees strokes <200ms (local transport)
- [ ] Named cursors show and fade per user
- [ ] Late joiner gets full current board
- [ ] Refresh restores board state (server-side)
- [ ] Board cleared on session end (not kept after)

### 4.5 Tools & Strokes
- [ ] Pen (2px): solid lines
- [ ] Marker (8px): translucent strokes
- [ ] Eraser: removes content
- [ ] Shapes: rect, ellipse, arrow, line
- [ ] Text & sticky note: click to place, type
- [ ] Laser pointer: fades 2s (provider feature; may be deferred)
- [ ] Undo/Redo: per-user without corrupting others' strokes (CRDT semantics)

### 4.6 Access Control
- [ ] View-only (default): student toolbar hidden; strokes rejected server-side (not just cosmetic)
- [ ] Toggle ON: students draw; OFF: reverts cleanly (no visual corruption)
- [ ] Late subscriber gets board on session-entry (if session running)

---

## 5. ACCEPTANCE CRITERIA (Master Checklist)

### 5.1 Chat & Moderation
- [ ] **Chat history for mid-class joiners**: divider "New messages" present
- [ ] **Unread badge**: counts correctly; clears when Chat tab opened
- [ ] **Enter/Shift+Enter**: behave correctly (send/newline)
- [ ] **500-char cap**: enforced client + server
- [ ] **Host delete**: message replaced for ALL participants (verify second browser); no orphaned text
- [ ] **Chat disabled**: students see "The host disabled chat"; no compose field
- [ ] **Delete audit**: logged to AuditLog or session engagement history

### 5.2 Q&A
- [ ] **Upvote order**: queue sorted by votes (descending), host sees it
- [ ] **Mark answered**: card collapses gray; hidden from "open" list
- [ ] **One vote per user**: double vote rejected server-side
- [ ] **Tab label**: shows answered count

### 5.3 Hands Queue
- [ ] **Raise order**: queue shows in raise-at order; persists across reconnects
- [ ] **Host lower**: clears tile chip; removes from queue
- [ ] **Own toggle**: user can lower own hand via Raise hand button
- [ ] **Queue persists**: survives refresh; cleared on session end

### 5.4 Reactions
- [ ] **Fixed list**: six emoji only (👍 ❤️ 😂 🎉 👏 💡)
- [ ] **Animation**: floats up tile for 2s, fades
- [ ] **Throttle**: 1 per 4s per user (rate-limited)
- [ ] **No emoji in chrome**: only in content cells

### 5.5 Polls
- [ ] **One live poll per session**: attempt to create 2nd rejected
- [ ] **Student vote**: non-dismissable card OR pinned "Poll live" chip opening it
- [ ] **Double vote prevention**: server rejects; client prevents via UI
- [ ] **Results visibility**: students do NOT see bars until host "Share results"
- [ ] **Host controls**:
  - Create poll: question + 2-5 options
  - Launch: students get voting card
  - Share results: reveals bars to everyone
  - End poll: archives (no new votes)
- [ ] **CSV export**: downloads with question, options, vote counts, optionally voter names (anonymization respected)
- [ ] **Poll history**: accessible to host after end (not in this commit; can defer to next)

### 5.6 Whiteboard
- [ ] **Two browsers**: host draws, student sees strokes <200ms
- [ ] **Named cursors**: visible and fade after 3s idle
- [ ] **View-only default**: student toolbar hidden; strokes rejected server-side
- [ ] **Toggle ON**: students draw; OFF: cleanly reverts
- [ ] **Late joiner**: gets full current board
- [ ] **Refresh**: board persists; no loss
- [ ] **Clear modal**: centered confirm; empties all clients
- [ ] **Export PNG**: saves to class resources with timestamp
- [ ] **Board cleared on session end**: not persisted after

### 5.7 Mobile & Accessibility
- [ ] **Rail → overlay sheet**: <768px; backdrop + Esc closes
- [ ] **Touch**: pen + single-finger draw; two-finger pan/zoom (if supported)
- [ ] **Whiteboard modal**: 90vw × 80vh on mobile
- [ ] **No emoji in chrome**: all ui icons are lucide-react
- [ ] **No raw errors**: all failures show friendly dark banner + Retry

### 5.8 Enrollment & Tier Gating
- [ ] **Starter hosts**: no built-in video; external link shown
- [ ] **Growth+ hosts**: whiteboard available; recording locked (upsell shown)
- [ ] **Pro hosts**: recording enabled; tier-appropriate content
- [ ] **Elite hosts**: all features + recording auto-share
- [ ] **Unentitled students**: entry blocked before provider room join

---

## 6. IMPLEMENTATION NOTES

### Backend Coverage
- Session engagement models (Message, Question, Poll, Hand) with indexes
- Authorization: host-only operations, subscription checks
- Result visibility: polls not shared until host flag set
- Audit: deletion operations logged
- CSV export: poll responses exported with metadata

### Frontend Coverage
- Engagement rail: tabs, message history, voting, hands queue
- Whiteboard: canvas-based drawing, realtime sync via Socket.IO
- Keyboard shortcuts: M, V, C, P, R (no intercept in inputs)
- Responsive: rail/sheet overlay <768px
- Dark theme: all tokens per spec (#0B1120, #111827, #4F46E5, etc.)

### Realtime Requirements
- Chat/reactions: broadcast via Socket.IO `whiteboard:event`, `chat-message`
- Hands queue: emit on raise/lower
- Whiteboard strokes: emit on add; join room on load
- Poll votes: client-side optimistic; server-validated
- Reconnect: restore state automatically

---

## 7. TESTING CHECKLIST

- [ ] Run backend tests: `npm test` (should pass 43+ tests)
- [ ] Build frontend: `npm run build` (no TypeScript errors, no warnings)
- [ ] Lint: `npm run lint` (if configured)
- [ ] Manual: two-browser test (host + student) for realtime features
- [ ] Mobile: test <768px overlay and touch drawing
- [ ] Accessibility: navigate with keyboard shortcuts; no raw error text
- [ ] Error recovery: refresh mid-poll; mid-chat; mid-whiteboard (should restore state)

---

## 8. KNOWN DEFERRED ITEMS

- **Reactions throttle server-side**: currently client-only (can add server validation in next phase)
- **Laser pointer provider feature**: placeholder in toolbar (enable when provider supports)
- **Poll history persistence**: can export after end; permanent archive deferred to Phase 2
- **Breakout rooms**: explicitly deferred to Phase 2 (Pro+ feature)
- **Co-host**: Elite-only feature; not in this commit
- **Comprehensive audit dashboard**: basic deletion logging added; full audit UI deferred
- **Email notifications**: engagement events (e.g., "Your question was answered") deferred

---

## 9. SIGN-OFF

- [ ] All 43 backend tests pass
- [ ] Frontend builds without errors/warnings
- [ ] Code review: no raw errors in UI, proper auth enforcement
- [ ] Manual QA: core flows work (chat, Q&A, hands, polls, whiteboard)
- [ ] Dark theme and icons verified
- [ ] Responsive behavior <768px verified
- [ ] Reconnect behavior tested

**Commits**:
- `90bd750` Room engagement: moderated chat + Q&A, raise-hand queue, reactions, live polls
- `c2cb560` Collaborative whiteboard: named cursors, host draw-permission toggle, PNG export to class resources
- `7936ff4` Complete engagement: raise hand queue, poll CSV export, result visibility
