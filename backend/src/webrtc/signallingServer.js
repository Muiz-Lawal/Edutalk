#!/usr/bin/env node
// Minimal WebSocket signalling server for WebRTC POC
// Uses the `ws` library (add to backend/package.json dependencies)

import http from 'http';
import express from 'express';
import { WebSocketServer } from 'ws';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Provide ICE server configuration for clients (optional). Set TURN_SERVERS as JSON string
// e.g. TURN_SERVERS='[{"urls":["turn:turn.example.com:3478"],"username":"user","credential":"pass"}]'
app.get('/webrtc/config', (req, res) => {
  try {
    const raw = process.env.TURN_SERVERS || process.env.WEBRTC_TURN_SERVERS || '';
    let iceServers = [];
    if (raw) {
      try {
        iceServers = JSON.parse(raw);
      } catch (e) {
        // support semicolon/comma separated basic urls
        const parts = raw.split(/[,;]\s*/).filter(Boolean);
        iceServers = parts.map(url => ({ urls: [url] }));
      }
    } else {
      // Provide a default STUN server so clients have at least STUN
      iceServers = [ { urls: ['stun:stun.l.google.com:19302'] } ];
    }

    return res.json({ iceServers });
  } catch (err) {
    console.error('Failed to build webrtc config', err.message);
    return res.status(500).json({ error: 'Failed to build config' });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Simple room mapping: roomId => set of sockets
const rooms = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      const { type, roomId, payload } = data;
      if (!roomId) return;

      if (type === 'join') {
        const set = rooms.get(roomId) || new Set();
        set.add(ws);
        rooms.set(roomId, set);
        // inform others
        for (const peer of set) {
          if (peer !== ws && peer.readyState === peer.OPEN) {
            peer.send(JSON.stringify({ type: 'peer-joined' }));
          }
        }
      } else if (type === 'signal') {
        const set = rooms.get(roomId) || new Set();
        // broadcast signal to other peers
        for (const peer of set) {
          if (peer !== ws && peer.readyState === peer.OPEN) {
            peer.send(JSON.stringify({ type: 'signal', payload }));
          }
        }
      } else if (type === 'leave') {
        const set = rooms.get(roomId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) rooms.delete(roomId);
        }
      }
    } catch (err) {
      console.error('Bad ws message', err.message);
    }
  });

  ws.on('close', () => {
    // remove ws from all rooms
    for (const [roomId, set] of rooms.entries()) {
      if (set.has(ws)) {
        set.delete(ws);
        if (set.size === 0) rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.WEBRTC_PORT || 4000;
server.listen(PORT, () => console.log(`Signalling server listening on ${PORT}`));
