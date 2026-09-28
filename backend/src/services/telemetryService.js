const MAX_RECENT_ENTRIES = 100;
const CLIENT_EVENTS = new Set([
  'session_joined',
  'reconnects',
  'provider_failures',
  'quote_failures',
  'client_errors',
]);
const SAFE_EVENT_NAMES = new Set([...CLIENT_EVENTS, 'client_error_report', 'privileged_action', 'error']);
const counters = new Map();
const recentEntries = [];
const seenClientEventIds = new Set();

const safeTimestamp = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const safeDetails = (details = {}) => {
  const allowedKeys = new Set(['status', 'code', 'errorName', 'routeSegment', 'attempt', 'recent']);
  return Object.fromEntries(Object.entries(details)
    .filter(([key]) => allowedKeys.has(key))
    .map(([key, value]) => {
      if (key === 'recent' && Array.isArray(value)) {
        return [key, value.slice(-20).map((entry) => ({
          name: SAFE_EVENT_NAMES.has(entry?.name) ? entry.name : 'event',
          timestamp: safeTimestamp(entry?.timestamp),
          details: safeDetails(entry?.details),
        }))];
      }
      if (key === 'errorName') return [key, String(value || 'Error').replace(/[^a-zA-Z0-9_$]/g, '').slice(0, 40) || 'Error'];
      if (key === 'routeSegment') {
        return [key, ['public', 'student', 'host', 'admin', 'room', 'app'].includes(value) ? value : 'app'];
      }
      if (key === 'code') return [key, /^[a-zA-Z0-9_-]{1,40}$/.test(String(value)) ? String(value) : 'unknown'];
      if (key === 'status') return [key, Number.isFinite(Number(value)) ? Number(value) : 0];
      if (key === 'attempt') return [key, Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0];
      return [key, undefined];
    })
    .filter(([, value]) => value !== undefined));
};

export const recordTelemetry = (name, details = {}, eventId) => {
  if (eventId && seenClientEventIds.has(eventId)) return;
  if (eventId) {
    seenClientEventIds.add(eventId);
    if (seenClientEventIds.size > MAX_RECENT_ENTRIES) {
      seenClientEventIds.delete(seenClientEventIds.values().next().value);
    }
  }
  counters.set(name, (counters.get(name) || 0) + 1);
  recentEntries.push({
    name: SAFE_EVENT_NAMES.has(name) ? name : 'event',
    details: safeDetails(details),
    timestamp: new Date().toISOString(),
  });
  if (recentEntries.length > MAX_RECENT_ENTRIES) recentEntries.shift();
};

export const ingestClientTelemetry = (payload = {}) => {
  const entries = Array.isArray(payload.recent) ? payload.recent.slice(-MAX_RECENT_ENTRIES) : [];
  for (const entry of entries) {
    if (!CLIENT_EVENTS.has(entry?.name) || typeof entry.id !== 'string') continue;
    recordTelemetry(entry.name, entry.details, entry.id);
  }
};

export const recordClientErrorReport = ({ errorName, routeSegment, recent }) => {
  recordTelemetry('client_error_report', {
    errorName: String(errorName || 'Error').replace(/[^a-zA-Z0-9_$]/g, '').slice(0, 40) || 'Error',
    routeSegment: ['public', 'student', 'host', 'admin', 'room', 'app'].includes(routeSegment) ? routeSegment : 'app',
    recent: Array.isArray(recent) ? recent.slice(-20) : [],
  });
};

export const getTelemetrySnapshot = () => ({
  counters: Object.fromEntries(counters),
  recent: [...recentEntries].reverse(),
});

export const resetTelemetry = () => {
  counters.clear();
  recentEntries.length = 0;
  seenClientEventIds.clear();
};

export default { recordTelemetry, ingestClientTelemetry, recordClientErrorReport, getTelemetrySnapshot, resetTelemetry };
