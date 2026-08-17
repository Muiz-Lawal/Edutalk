WebRTC POC — Signalling server

This folder contains a minimal WebSocket-based signalling server for a WebRTC POC.

Run locally (backend):

1. Install dependencies in backend:

   cd backend
   npm install

2. Start the signalling server (defaults to port 4000):

   WEBRTC_PORT=4000 npm run webrtc:dev

3. Open the frontend WebRTC POC page and point it at ws://localhost:4000

Notes:
- The signalling server is intentionally minimal for a POC. It broadcasts SDP and ICE candidates between peers in the same room.
- For production and NAT traversal, configure STUN and TURN servers.
- This server uses the `ws` library.
