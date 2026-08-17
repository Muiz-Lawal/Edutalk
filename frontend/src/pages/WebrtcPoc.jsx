import React, { useRef, useState } from 'react';

export default function WebrtcPoc() {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const [roomId, setRoomId] = useState('test-room');

  const start = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localRef.current.srcObject = localStream;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    // send local tracks
    localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));

    pc.ontrack = (e) => {
      remoteRef.current.srcObject = e.streams[0];
    };

    // connect to signalling
    const ws = new WebSocket('ws://localhost:4000');
    wsRef.current = ws;

    ws.onopen = async () => {
      ws.send(JSON.stringify({ type: 'join', roomId }));
    };

    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === 'signal') {
        const { sdp, candidate } = data.payload || {};
        if (sdp) {
          const desc = new RTCSessionDescription(sdp);
          await pc.setRemoteDescription(desc);
          if (desc.type === 'offer') {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'signal', roomId, payload: { sdp: pc.localDescription } }));
          }
        }
        if (candidate) {
          try { await pc.addIceCandidate(candidate); } catch (err) { console.warn(err); }
        }
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        ws.send(JSON.stringify({ type: 'signal', roomId, payload: { candidate: e.candidate } }));
      }
    };

    // create offer for others
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ type: 'signal', roomId, payload: { sdp: pc.localDescription } }));
  };

  return (
    <div>
      <h2>WebRTC POC</h2>
      <div>
        <label>Room: <input value={roomId} onChange={(e) => setRoomId(e.target.value)} /></label>
        <button onClick={start}>Start POC</button>
      </div>
      <div>
        <video ref={localRef} autoPlay playsInline muted style={{ width: 300 }} />
        <video ref={remoteRef} autoPlay playsInline style={{ width: 300 }} />
      </div>
    </div>
  );
}
