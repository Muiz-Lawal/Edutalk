TURN/STUN guidance for EduTalk WebRTC POC

STUN and TURN servers are necessary for NAT traversal. For testing, use public STUN servers; for production, deploy a TURN server (coturn) or use a managed provider.

Example environment variables

- TURN_URL=turn:turn.example.com:3478
- TURN_USER=turnuser
- TURN_PASS=turnpassword

Example RTC configuration (JS)

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [ 'turn:turn.example.com:3478' ],
    username: process.env.TURN_USER,
    credential: process.env.TURN_PASS,
  }
];

Notes:
- coturn can be deployed in a small VM and scaled horizontally behind a load balancer.
- For security, rotate TURN credentials and use time-limited TURN credentials when possible.
- Update the frontend POC RTCPeerConnection to include the `iceServers` array above when testing across NATs.
