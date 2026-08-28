import React, { useRef, useState } from 'react';

export default function RecordingPoc() {
  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [status, setStatus] = useState('idle');

  const startRecording = async () => {
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      window.localStream = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (e) => setChunks(prev => prev.concat(e.data));
      mr.onstop = () => setStatus('stopped');
      mr.start(1000);
      setRecording(true);
      setStatus('recording');
    } catch (err) {
      setStatus('error');
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
    setStatus('encoding');

    const blob = new Blob(chunks, { type: 'video/webm' });
    const form = new FormData();
    form.append('recording', blob, `recording_${Date.now()}.webm`);

    setStatus('uploading');
    try {
      const res = await fetch('/api/recordings/upload', { method: 'POST', body: form });
      const body = await res.json();
      setStatus(body.message || 'uploaded');
      console.log('Upload response', body);
    } catch (err) {
      console.error(err);
      setStatus('upload_failed');
    }
  };

  return (
    <div>
      <h2>Recording POC</h2>
      <div>Status: {status}</div>
      <div>
        <button onClick={startRecording} disabled={recording}>Start</button>
        <button onClick={stopRecording} disabled={!recording}>Stop & Upload</button>
      </div>
      <div>
        <video autoPlay playsInline muted style={{ width: 300 }} ref={(el) => { if (el && window.localStream) el.srcObject = window.localStream; }} />
      </div>
    </div>
  );
}
