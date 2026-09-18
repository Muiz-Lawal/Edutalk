import React, { useCallback, useEffect, useState } from 'react';
import { CameraOff, Check, Hand, Lock, MicOff, MoreVertical, Radio, Signal, UserPlus, Users, X } from 'lucide-react';
import api from '../utils/api';
import Modal from './ui/Modal';

const reasons = ['Accidental join', 'Disruptive', 'Not enrolled'];

function nameOf(item) {
  return [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || item.user?.name || 'Participant';
}

function ParticipantRow({ item, onAction, canManage }) {
  return <article className="command-participant-row">
    <div className="command-avatar">{nameOf(item).split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
    <div className="command-participant-info"><strong>{nameOf(item)}</strong><span>{item.role !== 'student' ? item.role.toUpperCase() : 'STUDENT'}</span></div>
    <MicOff size={15} className={item.audioEnabled === false ? 'is-muted' : ''} /><CameraOff size={15} className={item.videoEnabled === false ? 'is-muted' : ''} /><Signal size={15} />
    {canManage && <button type="button" className="command-more" onClick={() => onAction('menu', item)} aria-label={`Manage ${nameOf(item)}`}><MoreVertical size={17} /></button>}
  </article>;
}

export default function ParticipantCommandPanel({ roomId, sessionId, isHost, tier, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [menu, setMenu] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [reason, setReason] = useState(reasons[0]);
  const [hands, setHands] = useState([]);

  const load = useCallback(async () => {
    try {
      const response = await api.get(`/video/rooms/${encodeURIComponent(roomId)}/command-center`);
      setData(response.data);
      const engagement = await api.get(`/session-engagement/${sessionId}`);
      setHands(engagement.data.hands || []);
      setError('');
    } catch {
      setError('We could not load participants. Please retry.');
    }
  }, [roomId, sessionId]);

  useEffect(() => { load(); const timer = window.setInterval(load, 3000); return () => window.clearInterval(timer); }, [load]);

  const action = async (type, item, extra = {}) => {
    try {
      await api.patch(`/video/rooms/${encodeURIComponent(roomId)}/control`, { action: type, targetUserId: item?.userId || item?._id, ...extra });
      setMenu(null);
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.code === 'class_full' ? 'This class is full.' : 'That participant action could not be completed. Please retry.');
    }
  };

  const admitAll = () => action('admit_all');
  const participants = data?.participants || [];
  const waiting = data?.waiting || [];
  return <aside className="session-panel command-panel">
    <header className="command-panel-header"><div><Users size={17} /><strong>Participants</strong></div><button type="button" onClick={onClose} aria-label="Close participants"><X size={17} /></button></header>
    {error && <div className="session-engagement-error">{error} <button type="button" onClick={load}>Retry</button></div>}
    {!data ? <div className="session-panel__body"><div className="session-skeleton session-skeleton--short" /><div className="session-skeleton session-skeleton--short" /></div> : <div className="command-panel-body">
      <section className="command-hands"><h3><Hand size={15} /> Hands ({hands.length})</h3>{hands.map((item) => <div className="command-hand-row" key={item.id}><span>{item.user?.name || 'Participant'}</span>{isHost && <button type="button" onClick={async () => { try { await api.delete(`/session-engagement/${sessionId}/hands/${item.id}`); await load(); } catch { setError('The raised hand could not be lowered.'); } }}><Check size={14} /> Lower</button>}</div>)}</section>
      {waiting.length > 0 && <section className="command-waiting"><div className="command-section-title"><h3>Waiting room ({waiting.length})</h3>{isHost && <button type="button" onClick={admitAll}><UserPlus size={14} /> Admit all</button>}</div>{waiting.map((item) => <div className="command-waiting-row" key={item._id}><span>{nameOf(item)}</span>{isHost && <><button type="button" onClick={() => action('admit', item)}>Admit</button><button type="button" onClick={() => setRemoveTarget(item)}>Remove</button></>}</div>)}</section>}
      <section className="command-room-list"><h3>In the room ({participants.length})</h3>{participants.map((item) => <ParticipantRow key={item._id} item={item} canManage={isHost} onAction={(type) => setMenu(type === 'menu' ? item : null)} />)}</section>
      {isHost && <footer className="command-footer"><button type="button" onClick={() => action('lock', null, { value: !data.videoRoom.locked })}><Lock size={14} /> {data.videoRoom.locked ? 'Unlock room' : 'Lock room'}</button><button type="button" onClick={() => action('waiting_room', null, { value: !data.videoRoom.waitingRoomEnabled })}>{data.videoRoom.waitingRoomEnabled ? 'Turn off waiting room' : 'Turn on waiting room'}</button></footer>}
    </div>}
    {menu && <div className="command-action-menu"><button type="button" onClick={() => action('mute', menu)}><MicOff size={14} /> Mute</button><button type="button" onClick={() => action('stop_camera', menu)}><CameraOff size={14} /> Stop camera</button><button type="button" onClick={() => action('presenter', menu)}><Radio size={14} /> Make presenter</button>{tier === 'elite' && menu.role === 'student' && <button type="button" onClick={() => action('cohost', menu)}>Make co-host</button>}<button type="button" className="command-remove" onClick={() => { setRemoveTarget(menu); setMenu(null); }}>Remove</button></div>}
    <Modal open={Boolean(removeTarget)} title="Remove from class" onClose={() => setRemoveTarget(null)}><p>This participant will be blocked from rejoining for 60 seconds.</p><label>Reason<select value={reason} onChange={(event) => setReason(event.target.value)}>{reasons.map((item) => <option key={item}>{item}</option>)}</select></label><div className="session-modal-actions"><button type="button" onClick={() => setRemoveTarget(null)}>Cancel</button><button type="button" className="session-end" onClick={() => { action('remove', removeTarget, { reason }); setRemoveTarget(null); }}>Remove</button></div></Modal>
  </aside>;
}
