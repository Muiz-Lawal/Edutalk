import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { subscribeConnectionState } from '../utils/socket';

export default function ConnectionStatus() {
  const [state, setState] = useState('disconnected');
  const { pathname } = useLocation();

  useEffect(() => subscribeConnectionState(setState), []);

  if (state !== 'reconnecting') return null;
  return (
    <div className={`connection-status-banner ${pathname.startsWith('/session') ? 'connection-status-banner--dark' : ''}`} role="status" aria-live="polite">
      <Wifi size={15} aria-hidden="true" />
      <span>Reconnecting…</span>
    </div>
  );
}
