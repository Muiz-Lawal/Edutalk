const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function showToast(toast) {
  // toast: { title, message, type = 'info', ttl = 5000 }
  const t = { id: Date.now() + Math.random(), type: 'info', ttl: 5000, ...toast };
  for (const s of subscribers) {
    try { s(t); } catch (e) { console.error('Toast subscriber error', e); }
  }
}

export default { subscribe, showToast };