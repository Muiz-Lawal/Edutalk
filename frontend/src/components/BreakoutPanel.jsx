import React, { useCallback, useEffect, useState } from 'react';
import { DoorOpen, Megaphone, Plus, Timer, X } from 'lucide-react';
import api from '../utils/api';

export default function BreakoutPanel({ roomId, tier, onClose }) {
  const [data, setData] = useState(null);
  const [count, setCount] = useState(2);
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const load = useCallback(async () => {
    try {
      const response = await api.get(`/video/rooms/${encodeURIComponent(roomId)}/breakouts`);
      setData(response.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.code === 'plan_gate' ? 'Breakout rooms require a Pro plan.' : 'We could not load breakout rooms. Please retry.');
    }
  }, [roomId]);
  useEffect(() => { load(); const timer = window.setInterval(load, 3000); return () => window.clearInterval(timer); }, [load]);
  useEffect(() => {
    if (!data?.breakoutState?.closeAt) return undefined;
    const timer = window.setInterval(() => setSeconds(Math.max(0, Math.ceil((new Date(data.breakoutState.closeAt).getTime() - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [data?.breakoutState?.closeAt]);
  const update = async (action, body = {}) => {
    try { await api.patch(`/video/rooms/${encodeURIComponent(roomId)}/breakouts`, { action, ...body }); await load(); } catch { setError('That breakout action could not be completed. Please retry.'); }
  };
  if (tier !== 'pro' && tier !== 'elite') return <aside className="session-panel breakout-panel"><button type="button" onClick={onClose}><X size={16} /></button><h2>Breakout rooms</h2><p>Breakout rooms require a Pro plan or higher.</p></aside>;
  return <aside className="session-panel breakout-panel">
    <header className="command-panel-header"><div><DoorOpen size={17} /><strong>Breakout rooms</strong></div><button type="button" onClick={onClose} aria-label="Close breakout rooms"><X size={17} /></button></header>
    {error && <div className="session-engagement-error">{error} <button type="button" onClick={load}>Retry</button></div>}
    {!data ? <div className="session-panel__body"><div className="session-skeleton session-skeleton--short" /><div className="session-skeleton session-skeleton--short" /></div> : <div className="command-panel-body">
      {data.breakoutState?.status !== 'idle' && <div className="breakout-countdown"><Timer size={15} /> {data.breakoutState.status === 'closing' ? `Returning everyone in ${seconds}s` : `Rooms open · ${seconds}s remaining`}</div>}
      {!data.breakoutRooms?.length && <div className="session-empty"><p>Create rooms for small-group work.</p><label>Rooms<select value={count} onChange={(event) => setCount(Number(event.target.value))}>{[2, 3, 4, 5, 6, 7, 8].map((value) => <option key={value}>{value}</option>)}</select></label><label>Duration<select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))}><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option></select></label><button type="button" className="session-primary" onClick={() => update('create', { count, durationMinutes })}><Plus size={15} /> Create breakout rooms</button></div>}
      {data.breakoutRooms?.length > 0 && <><div className="breakout-room-list">{data.breakoutRooms.map((room) => <article className="breakout-room-card" key={room._id}><strong>{room.name}</strong><span>{room.participantIds?.length || 0} students · {room.durationMinutes} min</span></article>)}</div><div className="breakout-actions">{data.breakoutState?.status === 'idle' && <button type="button" onClick={() => update('open')}><DoorOpen size={15} /> Open rooms</button>}{data.breakoutState?.status === 'open' && <button type="button" onClick={() => update('close')}>Close rooms</button>}{data.breakoutState?.status === 'closing' && <button type="button" onClick={() => update('finish_close')}>Finish return</button>}</div><div className="breakout-broadcast"><textarea maxLength={300} value={announcement} onChange={(event) => setAnnouncement(event.target.value)} placeholder="Announcement to all rooms" /><button type="button" onClick={() => { update('broadcast', { announcement }); setAnnouncement(''); }}><Megaphone size={15} /> Broadcast</button></div></>}
    </div>}
  </aside>;
}
