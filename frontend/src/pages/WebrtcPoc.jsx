import React, { useRef, useState } from 'react';

export default function WebrtcPoc() {
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const [roomId, setRoomId] = useState('test-room');

  // Recording state
  const [recorder, setRecorder] = useState(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

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

  // Two-peer local loopback (no signalling) useful for quick POC/debugging
  const startTwoPeerLoop = async () => {
    const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localRef.current.srcObject = localStream;

    const pc1 = new RTCPeerConnection();
    const pc2 = new RTCPeerConnection();

    // Handle tracks
    pc2.ontrack = (e) => { remoteRef.current.srcObject = e.streams[0]; };

    // ICE exchange
    pc1.onicecandidate = (e) => { if (e.candidate) pc2.addIceCandidate(e.candidate).catch(console.warn); };
    pc2.onicecandidate = (e) => { if (e.candidate) pc1.addIceCandidate(e.candidate).catch(console.warn); };

    // Add local tracks to pc1
    localStream.getTracks().forEach(t => pc1.addTrack(t, localStream));

    const offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
    await pc2.setRemoteDescription(offer);
    const answer = await pc2.createAnswer();
    await pc2.setLocalDescription(answer);
    await pc1.setRemoteDescription(answer);

    // Save one pc to ref to allow cleanup
    pcRef.current = pc1;
  };

  // Recording functions
  const startRecording = async () => {
    if (!localRef.current || !localRef.current.srcObject) {
      console.warn('No local stream available to record');
      return;
    }
    const stream = localRef.current.srcObject;
    const options = { mimeType: 'video/webm;codecs=vp9,opus' };
    const mr = new MediaRecorder(stream, options);
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const fd = new FormData();
      fd.append('recording', blob, `recording_${Date.now()}.webm`);
      try {
        const res = await fetch('/api/recordings/upload', { method: 'POST', body: fd });
        const json = await res.json();
        console.log('Upload response', json);
        alert('Recording uploaded: ' + (json.path || json.filename || 'ok'));
      } catch (err) {
        console.error('Upload failed', err);
        alert('Upload failed: ' + err.message);
      }
    };
    mr.start();
    setRecorder(mr);
    setRecording(true);
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setRecording(false);
    }
  };

  return (
    <div>
      <h2>WebRTC POC</h2>
      <div>
        <label>Room: <input value={roomId} onChange={(e) => setRoomId(e.target.value)} /></label>
        <button onClick={start}>Start POC (Signalling)</button>
        <button onClick={startTwoPeerLoop} style={{ marginLeft: 8 }}>Start Two-Peer Loop</button>
      </div>
      <div style={{ marginTop: 12 }}>
        <video ref={localRef} autoPlay playsInline muted style={{ width: 300, border: '1px solid #ddd' }} />
        <video ref={remoteRef} autoPlay playsInline style={{ width: 300, border: '1px solid #ddd', marginLeft: 8 }} />
      </div>

      <div style={{ marginTop: 16 }}>
        <h4>Recording POC</h4>
        <button onClick={startRecording} disabled={recording}>Start Recording</button>
        <button onClick={stopRecording} disabled={!recording} style={{ marginLeft: 8 }}>Stop & Upload</button>
      </div>
    </div>
  );
}
