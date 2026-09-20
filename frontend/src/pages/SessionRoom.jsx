import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowBigUp, Camera, CameraOff, CheckCircle, ChevronLeft, ChevronRight, CircleHelp, Clock3, DoorOpen, Hand, LayoutGrid,
  Lock, Maximize2, Mic, MicOff, MonitorUp, Network, PanelRight, Phone, Play, Presentation,
  Radio, Settings, Signal, Smile, Users, Video, Volume2, X,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { getVideoProvider } from '../lib/video-provider';
import LockedFeatureCard from '../components/ui/LockedFeatureCard';
import Modal from '../components/ui/Modal';
import WhiteboardStage from '../components/WhiteboardStage';
import ParticipantCommandPanel from '../components/ParticipantCommandPanel';
import BreakoutPanel from '../components/BreakoutPanel';
import '../styles/SessionRoom.css';

const layouts = ['spotlight', 'grid', 'sidebar'];
const reactions = ['👏', '👍', '❤️', '🎉'];
const initialParticipant = (user, isHost) => ({
  id: 'local',
  name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
  isHost,
  audioEnabled: true,
  videoEnabled: true,
  speaking: false,
  handRaised: false,
  quality: 'good',
});

function formatTimer(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function FriendlyError({ message, onRetry }) {
  return <div className="session-error" role="alert"><CircleHelp size={18} /><div><strong>We couldn’t join this class</strong><p>{message}</p><button type="button" onClick={onRetry}>Retry</button></div></div>;
}

function ParticipantTile({ participant, local, onPin, presenting }) {
  const initials = participant.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return <article className={`session-tile ${participant.speaking ? 'session-tile--speaking' : ''} ${presenting ? 'session-tile--presenting' : ''}`}>
    {participant.videoEnabled && participant.stream ? <video className="session-tile__video" ref={(node) => { if (node) node.srcObject = participant.stream; }} autoPlay playsInline muted={local} /> : <div className="session-tile__avatar">{initials}</div>}
    <div className="session-tile__name">{participant.name} {local && '(You)'}</div>
    {participant.isHost && <span className="session-tile__host">HOST</span>}
    {presenting && <span className="session-tile__presenting">Presenting</span>}
    {participant.handRaised && <span className="session-tile__hand"><Hand size={14} /></span>}
    {!participant.audioEnabled && <span className="session-tile__muted"><MicOff size={14} /></span>}
    <span className={`session-tile__quality session-tile__quality--${participant.quality || 'good'}`}><Signal size={14} /></span>
    <button type="button" className="session-tile__pin" onClick={() => onPin(participant.id)} aria-label={`Pin ${participant.name}`}><Maximize2 size={14} /> Pin for me</button>
  </article>;
}

export default function SessionRoom() {
  const { id: sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, activeRole } = useAuth();
  const provider = useMemo(() => getVideoProvider(), []);
  const connectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const [stage, setStage] = useState('loading');
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState('');
  const [permissionError, setPermissionError] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState({ camera: '', mic: '', speaker: '' });
  const [previewStream, setPreviewStream] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [layout, setLayout] = useState(() => localStorage.getItem('session-layout') || 'spotlight');
  const [page, setPage] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showBreakouts, setShowBreakouts] = useState(false);
  const [breakoutAssignment, setBreakoutAssignment] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showRecordingUpgrade, setShowRecordingUpgrade] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingId, setRecordingId] = useState(null);
  const [recordingStreamUid, setRecordingStreamUid] = useState(null);
  const [recordingError, setRecordingError] = useState('');
  const [sessionSummary, setSessionSummary] = useState(null);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const [removedFromClass, setRemovedFromClass] = useState(false);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [pinnedId, setPinnedId] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [livePoll, setLivePoll] = useState(null);
  const [engagementLoaded, setEngagementLoaded] = useState(false);
  const [engagementError, setEngagementError] = useState('');
  const [railTab, setRailTab] = useState('chat');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [unreadChat, setUnreadChat] = useState(0);
  const [qaInput, setQaInput] = useState('');
  const [reaction, setReaction] = useState(null);
  const [showReactions, setShowReactions] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [presenterId, setPresenterId] = useState('');
  const [handId, setHandId] = useState(null);
  const isHost = activeRole === 'host' || searchParams.get('role') === 'host';
  const tier = classData?.hostId?.activatedPlanTier || classData?.hostId?.planTier || 'starter';
  const recordingUnlocked = ['pro', 'elite'].includes(tier);
  const localParticipant = useMemo(() => ({ ...initialParticipant(user, isHost), audioEnabled, videoEnabled, handRaised, stream: localStreamRef.current }), [user, isHost, audioEnabled, videoEnabled, handRaised, previewStream]);
  const allParticipants = useMemo(() => [localParticipant, ...participants], [localParticipant, participants]);

  const loadClass = useCallback(async () => {
    setError('');
    setStage('loading');
    try {
      const response = await api.get(`/classes/${sessionId}`);
      setClassData(response.data);
      if (!isHost && response.data?.subscriptionStatus && response.data.subscriptionStatus !== 'active') {
        setStage('blocked');
        return;
      }
      setStage('green');
    } catch (requestError) {
      setError('Check your enrollment and try again.');
      setStage('error');
    }
  }, [sessionId, isHost]);

  useEffect(() => { loadClass(); }, [loadClass]);

  const loadEngagement = useCallback(async () => {
    try {
      const { data } = await api.get(`/session-engagement/${sessionId}`);
      setChatMessages(data.messages || []);
      setQuestions(data.questions || []);
      setLivePoll(data.poll || null);
      setChatEnabled(data.chatEnabled !== false);
      setEngagementLoaded(true);
      setEngagementError('');
    } catch {
      setEngagementError('We could not load engagement tools. Please retry.');
    }
  }, [sessionId]);

  useEffect(() => {
    if (stage === 'room' || stage === 'lobby') loadEngagement();
  }, [stage, loadEngagement]);

  const postMessage = async (event) => {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text || connectionState === 'reconnecting' || text.length > 500) return;
    try {
      const { data } = await api.post(`/session-engagement/${sessionId}/messages`, { text });
      setChatMessages((items) => [...items, data]);
      setChatInput('');
      setUnreadChat(0);
    } catch { setEngagementError('Your message could not be sent. Please retry.'); }
  };
  const toggleHand = async () => {
    try {
      if (handId) {
        await api.delete(`/session-engagement/${sessionId}/hands/${handId}`);
        setHandId(null);
        setHandRaised(false);
      } else {
        const { data } = await api.post(`/session-engagement/${sessionId}/hands`);
        setHandId(data.id);
        setHandRaised(true);
      }
    } catch {
      setEngagementError('Your raised hand could not be updated. Please retry.');
    }
  };

  const createQuestion = async (event) => {
    event.preventDefault();
    const text = qaInput.trim();
    if (!text) return;
    try {
      const { data } = await api.post(`/session-engagement/${sessionId}/questions`, { text });
      setQuestions((items) => [...items, data]);
      setQaInput('');
    } catch { setEngagementError('Your question could not be sent. Please retry.'); }
  };

  const voteQuestion = async (questionId) => {
    try {
      const { data } = await api.post(`/session-engagement/${sessionId}/questions/${questionId}/vote`);
      setQuestions((items) => items.map((item) => item._id === questionId ? data : item));
    } catch { setEngagementError('You already voted for this question.'); }
  };

  const updateQuestion = async (questionId, status) => {
    try {
      const { data } = await api.patch(`/session-engagement/${sessionId}/questions/${questionId}`, { status });
      setQuestions((items) => items.map((item) => item._id === questionId ? data : item));
    } catch { setEngagementError('The question could not be updated.'); }
  };

  const deleteMessage = async (messageId) => {
    try {
      const { data } = await api.delete(`/session-engagement/${sessionId}/messages/${messageId}`);
      setChatMessages((items) => items.map((item) => item._id === messageId ? data : item));
    } catch { setEngagementError('The message could not be removed.'); }
  };

  const toggleChatEnabled = async () => {
    try {
      const { data } = await api.patch(`/session-engagement/${sessionId}/chat`, { enabled: !chatEnabled });
      setChatEnabled(data.chatEnabled);
    } catch { setEngagementError('Chat settings could not be updated.'); }
  };

  const loadDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list);
      setSelectedDevices((current) => ({
        camera: current.camera || list.find((device) => device.kind === 'videoinput')?.deviceId || '',
        mic: current.mic || list.find((device) => device.kind === 'audioinput')?.deviceId || '',
        speaker: current.speaker || list.find((device) => device.kind === 'audiooutput')?.deviceId || '',
      }));
    } catch {
      setPermissionError(true);
    }
  }, []);

  const requestPreview = useCallback(async () => {
    try {
      const stream = await provider.getUserMedia({
        video: selectedDevices.camera ? { deviceId: { exact: selectedDevices.camera } } : true,
        audio: selectedDevices.mic ? { deviceId: { exact: selectedDevices.mic }, echoCancellation: true, noiseSuppression: true } : true,
      });
      localStreamRef.current = stream;
      setPreviewStream(stream);
      setPermissionError(false);
      await loadDevices();
    } catch {
      setPermissionError(true);
    }
  }, [loadDevices, provider, selectedDevices.camera, selectedDevices.mic]);

  useEffect(() => { if (stage === 'green') { loadDevices(); requestPreview(); } }, [stage, loadDevices, requestPreview]);

  const joinRoom = async (withoutCamera = false) => {
    try {
      if (!localStreamRef.current) await requestPreview();
      if (withoutCamera) {
        localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = false; });
        setVideoEnabled(false);
      }
      const room = await provider.createRoom(sessionId);
      setRoomId(room.roomId);
      connectionRef.current = await provider.createConnection({
        roomId: room.roomId,
        token: localStorage.getItem('token'),
        onStateChange: setConnectionState,
        onParticipants: setParticipants,
        onBreakoutAssignment: setBreakoutAssignment,
      });
      setStage(isHost ? 'room' : 'lobby');
    } catch (joinError) {
      if (joinError?.code === 'removed_from_class') setRemovedFromClass(true);
      setError(joinError?.code === 'class_full' ? 'This class is full.' : 'We could not connect you to the classroom. Please retry.');
      setStage('error');
    }
  };

  useEffect(() => () => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    connectionRef.current?.leave();
  }, []);

  useEffect(() => {
    if (!recording) return undefined;
    const timer = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (!roomId || (stage !== 'lobby' && stage !== 'room')) return undefined;
    const checkAdmission = async () => {
      try {
        const { data } = await api.get(`/video/rooms/${encodeURIComponent(roomId)}/state`);
        setPresenterId(data.presenterId || '');
        if (data.admitted && stage === 'lobby') setStage('room');
        if (data.status === 'closed') setStage('ended');
      } catch {
        // The room's existing reconnecting state handles transient polling failures.
      }
    };
    const timer = window.setInterval(checkAdmission, 3000);
    checkAdmission();
    return () => window.clearInterval(timer);
  }, [roomId, stage]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') { setShowChat(false); setShowWhiteboard(false); setShowSettings(false); return; }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === 'm') toggleAudio();
      if (key === 'v') toggleVideo();
      if (key === 'c') setShowChat((value) => !value);
      if (key === 'p') setShowParticipants((value) => !value);
      if (key === 'r') toggleHand();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleAudio = () => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !audioEnabled; });
    setAudioEnabled((value) => !value);
    connectionRef.current?.setLocalState({ audioEnabled: !audioEnabled });
  };
  const toggleVideo = () => {
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !videoEnabled; });
    setVideoEnabled((value) => !value);
    connectionRef.current?.setLocalState({ videoEnabled: !videoEnabled });
  };
  const toggleScreen = async () => {
    if (screenSharing) {
      await connectionRef.current?.stopScreenShare();
      setScreenSharing(false);
    } else {
      const stream = await connectionRef.current?.shareScreen();
      setScreenSharing(Boolean(stream));
    }
  };
  const toggleRecording = async () => {
    if (!recordingUnlocked) { setShowRecordingUpgrade(true); return; }
    setRecordingError('');
    try {
      if (!recording) {
        const { data } = await api.post('/recordings/start', {
          sessionId,
          classId: classData?._id || classData?.id,
        });
        setRecordingId(data.recording?.id || data.recording?._id);
        setRecordingStreamUid(data.recording?.streamUid || null);
        setRecording(true);
        setRecordingSeconds(0);
      } else {
        await api.post('/recordings/complete', {
          recordingId,
          streamUid: recordingStreamUid,
          duration: recordingSeconds,
        });
        setRecording(false);
        setRecordingSeconds(0);
      }
    } catch {
      setRecordingError('Recording could not be updated. Please retry.');
    }
  };
  const sendReaction = (value) => {
    setReaction(value);
    setShowReactions(false);
    window.setTimeout(() => setReaction(null), 2000);
  };
  const leave = async () => {
    await connectionRef.current?.leave();
    navigate(`/class/${classData?._id || classData?.id || sessionId}`, { state: { toast: 'You left the class' } });
  };
  const endForAll = async () => {
    try {
      await connectionRef.current?.endForAll();
      const { data } = await api.get(`/video/rooms/${encodeURIComponent(roomId)}/summary`);
      setSessionSummary(data);
      setShowEndModal(false);
      setShowSessionSummary(true);
    } catch {
      setError('The class could not be ended cleanly. Please retry.');
    }
  };
  const updateLayout = (value) => { setLayout(value); localStorage.setItem('session-layout', value); };
  const visibleParticipants = layout === 'grid' ? allParticipants.slice(page * 24, page * 24 + 24) : allParticipants;

  if (stage === 'loading') return <div className="session-room session-room--center"><div className="session-skeleton" /><div className="session-skeleton session-skeleton--short" /></div>;
  if (removedFromClass) return <div className="session-room session-room--center"><div className="session-card session-card--blocked"><Lock size={28} /><h1>The host removed you from this class</h1><p>You can try again after the 60-second rejoin cooldown.</p><button type="button" onClick={() => navigate(`/class/${sessionId}`)}>Back to class</button></div></div>;
  if (stage === 'error') return <div className="session-room session-room--center"><FriendlyError message={error} onRetry={loadClass} /></div>;
  if (stage === 'ended') return <div className="session-room session-room--center"><div className="session-card"><CheckCircle size={28} /><h1>Class ended</h1><p>See you next session!</p><button type="button" onClick={() => navigate(`/class/${classData?._id || classData?.id || sessionId}`)}>Back to class</button></div></div>;
  if (stage === 'blocked') return <div className="session-room session-room--center"><div className="session-card session-card--blocked"><Lock size={28} /><h1>This class needs an active enrollment</h1><p>Join an active enrollment before entering the classroom.</p><button type="button" onClick={() => navigate(`/class/${sessionId}`)}>View class</button></div></div>;
  if (permissionError && stage === 'green') return <div className="session-room session-room--center"><div className="session-card"><CircleHelp size={28} /><h1>Camera and microphone access is blocked</h1><p>Open your browser site settings, allow camera and microphone access for this site, then retry. In Safari, choose Settings for This Website. In Chrome or Edge, select the lock icon beside the address and allow Camera and Microphone.</p><button type="button" onClick={requestPreview}>Retry</button></div></div>;
  if (stage === 'green') return <div className="session-room session-room--center"><div className="session-card session-green-room"><div className="session-preview"><video ref={(node) => { if (node) node.srcObject = previewStream; }} autoPlay muted playsInline /></div><h1>Ready to join?</h1><p>Your camera stays off until you enable it.</p><div className="session-device-grid">{[['camera', 'Camera', 'videoinput'], ['mic', 'Microphone', 'audioinput'], ['speaker', 'Speaker', 'audiooutput']].map(([key, label, kind]) => <label key={key}>{label}<select value={selectedDevices[key]} onChange={(event) => setSelectedDevices({ ...selectedDevices, [key]: event.target.value })}>{devices.filter((device) => device.kind === kind).map((device) => <option value={device.deviceId} key={device.deviceId}>{device.label || label}</option>)}</select></label>)}</div><div className="session-card__actions"><button type="button" className="session-primary" onClick={() => joinRoom(false)}>Join class</button><button type="button" className="session-outline" onClick={() => joinRoom(true)}>Join without camera</button></div></div></div>;
  if (stage === 'lobby') return <div className="session-room session-room--center"><div className="session-card"><Clock3 size={28} /><h1>{classData?.title || 'Classroom'}</h1><p>Hosted by {classData?.hostId?.firstName || 'your host'}</p><p className="session-secondary">The host will let you in when class starts.</p><div className="session-lobby-preview"><video ref={(node) => { if (node) node.srcObject = previewStream; }} autoPlay muted playsInline /></div><div className="session-lobby-actions"><button type="button" onClick={toggleAudio}>{audioEnabled ? <Mic size={16} /> : <MicOff size={16} />} Microphone</button><button type="button" onClick={toggleVideo}>{videoEnabled ? <Camera size={16} /> : <CameraOff size={16} />} Camera</button></div><button type="button" className="session-cancel" onClick={() => navigate('/dashboard')}>Cancel</button></div></div>;

  return <div className="session-room">
    {connectionState === 'reconnecting' && <div className="session-status session-status--warning">Reconnecting…</div>}
    {connectionState === 'connected' && <div className="session-status session-status--connected"><Network size={14} /> Connected</div>}
    {recording && <div className="session-recording-chip"><Radio size={12} /> Recording · {formatTimer(recordingSeconds)}</div>}
    {breakoutAssignment?.action === 'open' && <div className="session-breakout-notice"><DoorOpen size={14} /> You are moving to {breakoutAssignment.breakoutName || 'your breakout room'}.</div>}
    {breakoutAssignment?.action === 'closing' && <div className="session-breakout-notice"><Clock3 size={14} /> Breakouts are closing. You will return to the main room soon.</div>}
    {recordingError && <div className="session-status session-status--warning">{recordingError}</div>}
    <header className="session-topbar"><div><span className="session-eyebrow">Live classroom</span><h1>{classData?.title || 'Classroom'}</h1></div><div className="session-topbar__actions"><select aria-label="Layout" value={layout} onChange={(event) => updateLayout(event.target.value)}>{layouts.map((item) => <option value={item} key={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select><button type="button" onClick={() => setShowSettings((value) => !value)} aria-label="Settings"><Settings size={18} /></button></div></header>
    <main className={`session-stage session-stage--${layout}`}>
      {layout === 'sidebar' && (showWhiteboard ? <WhiteboardStage sessionId={sessionId} isHost={isHost} layout={layout} onClose={() => setShowWhiteboard(false)} /> : <div className="session-docked-stage"><Presentation size={34} /><span>Shared stage</span><small>Whiteboard and engagement tools will appear here.</small></div>)}
      {layout !== 'sidebar' && showWhiteboard && <WhiteboardStage sessionId={sessionId} isHost={isHost} layout={layout} onClose={() => setShowWhiteboard(false)} />}
      <section className="session-tiles">{visibleParticipants.map((participant) => <ParticipantTile key={participant.id} participant={participant} local={participant.id === 'local'} presenting={String(participant.id) === String(presenterId)} onPin={setPinnedId} />)}</section>
      {layout === 'grid' && allParticipants.length > 24 && <div className="session-pagination"><button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))}><ChevronLeft size={16} /></button><span>{page + 1} / {Math.ceil(allParticipants.length / 24)}</span><button type="button" onClick={() => setPage((value) => Math.min(Math.ceil(allParticipants.length / 24) - 1, value + 1))}><ChevronRight size={16} /></button></div>}
      {layout === 'sidebar' && <aside className="session-rail">{allParticipants.map((participant) => <ParticipantTile key={participant.id} participant={participant} local={participant.id === 'local'} presenting={String(participant.id) === String(presenterId)} onPin={setPinnedId} />)}</aside>}
    </main>
    {showSettings && <div className="session-settings"><h2>Settings</h2><label><input type="checkbox" defaultChecked /> Mirror my video</label><label><input type="checkbox" defaultChecked /> Noise suppression</label><p>Shortcuts: M microphone, V camera, C chat, P participants, R raise hand</p></div>}
    {showParticipants && roomId && <ParticipantCommandPanel roomId={roomId} sessionId={sessionId} isHost={isHost} tier={tier} onClose={() => setShowParticipants(false)} />}
    {showBreakouts && roomId && <BreakoutPanel roomId={roomId} tier={tier} onClose={() => setShowBreakouts(false)} />}
    {showChat && <aside className="session-panel session-engagement-rail"><div className="session-rail-tabs"><button type="button" className={railTab === 'chat' ? 'is-active' : ''} onClick={() => { setRailTab('chat'); setUnreadChat(0); }}>Chat {unreadChat > 0 && <b>{unreadChat}</b>}</button><button type="button" className={railTab === 'qa' ? 'is-active' : ''} onClick={() => setRailTab('qa')}>Q&amp;A {questions.filter((item) => item.status === 'answered').length > 0 && <b>{questions.filter((item) => item.status === 'answered').length}</b>}</button><button type="button" className={railTab === 'participants' ? 'is-active' : ''} onClick={() => setRailTab('participants')}>Participants</button><button type="button" onClick={() => setShowChat(false)}><X size={16} /></button></div>{engagementError && <div className="session-engagement-error">{engagementError} <button type="button" onClick={loadEngagement}>Retry</button></div>}{!engagementLoaded ? <div className="session-panel__body"><div className="session-skeleton session-skeleton--short" /><div className="session-skeleton session-skeleton--short" /></div> : railTab === 'chat' ? <><div className="session-panel__body">{!chatEnabled && !isHost ? <p className="session-empty">The host disabled chat</p> : chatMessages.map((message) => <article className={`session-message ${String(message.userId) === String(user?._id || user?.id) ? 'session-message--own' : ''}`} key={message._id}><strong>{message.user?.name || 'Participant'} {message.isHost && <small>HOST</small>}</strong><time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time><p className={message.deletedAt ? 'session-message--removed' : ''}>{message.text}</p>{isHost && !message.deletedAt && <button type="button" onClick={() => deleteMessage(message._id)}>Delete</button>}</article>)}</div>{isHost && <button type="button" className="session-chat-toggle" onClick={toggleChatEnabled}>{chatEnabled ? 'Disable chat' : 'Enable chat'}</button>}{chatEnabled && <form onSubmit={postMessage}><textarea maxLength={500} rows={1} value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder={connectionState === 'reconnecting' ? 'Chat is reconnecting…' : 'Write a message'} disabled={connectionState === 'reconnecting'} /><span>{chatInput.length >= 450 ? `${chatInput.length}/500` : ''}</span><button type="submit">Send</button></form>}</> : railTab === 'qa' ? <><div className="session-panel__body">{questions.filter((item) => item.status !== 'dismissed').sort((a, b) => (b.voteCount || b.upvotes?.length || 0) - (a.voteCount || a.upvotes?.length || 0)).map((question) =>     <article className={`session-question ${question.status === 'answered' ? 'is-answered' : ''}`} key={question._id}><p>{question.text}</p><div><button type="button" onClick={() => voteQuestion(question._id)}><ArrowBigUp size={15} /> {question.voteCount || question.upvotes?.length || 0}</button>{isHost && question.status === 'open' && <button type="button" onClick={() => updateQuestion(question._id, 'answered')}>Mark answered</button>}</div></article>)}</div><form onSubmit={createQuestion}><textarea maxLength={500} value={qaInput} onChange={(event) => setQaInput(event.target.value)} placeholder="Ask a question" /><button type="submit">Ask</button></form></> : <div className="session-panel__body">{allParticipants.map((participant) => <p key={participant.id}>{participant.name} {participant.handRaised && <span className="session-hand-label">Hands raised</span>}</p>)}</div>}</aside>}
    <nav className="session-controls" aria-label="Classroom controls">
      <button type="button" className={audioEnabled ? '' : 'is-active'} onClick={toggleAudio}>{audioEnabled ? <Mic size={20} /> : <MicOff size={20} />}<span>Mic</span></button>
      <button type="button" className={videoEnabled ? '' : 'is-active'} onClick={toggleVideo}>{videoEnabled ? <Camera size={20} /> : <CameraOff size={20} />}<span>Camera</span></button>
      <button type="button" className={screenSharing ? 'is-active' : ''} onClick={toggleScreen}><MonitorUp size={20} /><span>Share</span></button>
      <button type="button" className={showWhiteboard ? 'is-active' : ''} onClick={() => setShowWhiteboard((value) => !value)}><Presentation size={20} /><span>Whiteboard</span></button>
      <button type="button" className={recording ? 'is-recording' : ''} onClick={toggleRecording}>{recording ? <Radio size={20} /> : recordingUnlocked ? <Circle size={20} /> : <Lock size={18} />}<span>{recording ? `Record · ${formatTimer(recordingSeconds)}` : 'Record'}</span></button>
      <div className="session-reaction-wrap"><button type="button" onClick={() => setShowReactions((value) => !value)}><Smile size={20} /><span>Reactions</span></button>{showReactions && <div className="session-reactions">{['👍', '❤️', '😂', '🎉', '👏', '💡'].map((item) => <button type="button" key={item} onClick={() => sendReaction(item)}>{item}</button>)}<button type="button" onClick={() => { toggleHand(); setShowReactions(false); }}><Hand size={15} /> Raise hand</button></div>}</div>
      <button type="button" className={handRaised ? 'is-active' : ''} onClick={toggleHand}><Hand size={20} /><span>Raise hand</span></button>
      <button type="button" className={showChat ? 'is-active' : ''} onClick={() => setShowChat((value) => !value)}><PanelRight size={20} /><span>Chat {unreadChat > 0 ? `(${unreadChat})` : ''}</span></button>
      <button type="button" className={showParticipants ? 'is-active' : ''} onClick={() => setShowParticipants((value) => !value)}><Users size={20} /><span>Participants {allParticipants.length}</span></button>
      {isHost && (tier === 'pro' || tier === 'elite') && <button type="button" className={showBreakouts ? 'is-active' : ''} onClick={() => setShowBreakouts((value) => !value)}><DoorOpen size={20} /><span>Breakouts</span></button>}
      <div className="session-controls__leave">{isHost ? <><button type="button" onClick={leave}>Leave</button><button type="button" className="session-end" onClick={() => setShowEndModal(true)}><Phone size={20} /><span>End for all</span></button></> : <button type="button" className="session-end" onClick={leave}><Phone size={20} /><span>Leave</span></button>}</div>
    </nav>
    {reaction && <div className="session-floating-reaction" aria-live="polite">{reaction}</div>}
    <Modal open={showRecordingUpgrade} title="Recording is a Pro feature" onClose={() => setShowRecordingUpgrade(false)}><LockedFeatureCard feature="recording" tier={tier} subscribers={classData?.hostId?.totalActiveStudents || 0} threshold={73} /></Modal>
    <Modal open={showEndModal} title="End class for everyone" onClose={() => setShowEndModal(false)}><p>{Math.max(0, allParticipants.length - 1)} students will be disconnected.</p><div className="session-modal-actions"><button type="button" onClick={() => setShowEndModal(false)}>Cancel</button><button type="button" className="session-end" onClick={endForAll}>End for all</button></div></Modal>
    <Modal open={showSessionSummary} title="Session summary" onClose={() => setShowSessionSummary(false)}><div className="session-summary-grid"><div><span>Duration</span><strong>{formatTimer(sessionSummary?.durationSeconds || 0)}</strong></div><div><span>Peak participants</span><strong>{sessionSummary?.peakParticipants || 0}</strong></div><div><span>Chat messages</span><strong>{sessionSummary?.chatMessages || 0}</strong></div><div><span>Polls</span><strong>{sessionSummary?.pollCount || 0}</strong></div></div>{sessionSummary?.recording && <p>Recording: {sessionSummary.recording.status === 'review_hold' ? `In review — ready in ${Math.ceil(Math.max(0, new Date(sessionSummary.recording.reviewHoldUntil).getTime() - Date.now()) / 3600000)}h` : sessionSummary.recording.status}</p>}<div className="session-modal-actions"><button type="button" onClick={async () => { const response = await api.get(`/video/rooms/${encodeURIComponent(roomId)}/attendance.csv`, { responseType: 'blob' }); const link = document.createElement('a'); link.href = URL.createObjectURL(response.data); link.download = 'session-attendance.csv'; link.click(); URL.revokeObjectURL(link.href); }}>Export attendance</button><button type="button" className="session-primary" onClick={() => navigate(`/class/${classData?._id || classData?.id || sessionId}`)}>Back to class</button></div></Modal>
  </div>;
}
