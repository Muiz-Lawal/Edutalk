export type ClientTelemetryEntry = {
  id: string;
  name: string;
  details: Record<string, string | number | boolean>;
  timestamp: string;
};

export type ClientTelemetrySnapshot = {
  counters: Record<string, number>;
  recent: ClientTelemetryEntry[];
};

const MAX_ENTRIES = 100;
const ALLOWED_COUNTERS = new Set([
  'session_joined',
  'reconnects',
  'provider_failures',
  'quote_failures',
  'client_errors',
]);
const ALLOWED_DETAIL_KEYS = new Set(['status', 'code', 'errorName', 'routeSegment', 'attempt']);
const counters: Record<string, number> = {};
const entries: ClientTelemetryEntry[] = [];
let transport: ((snapshot: ClientTelemetrySnapshot) => void) | null = null;
let uploadTimer: ReturnType<typeof setTimeout> | null = null;
let errorSanitizerInstalled = false;

function safeDetails(details: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(details)
      .filter(([key, value]) => ALLOWED_DETAIL_KEYS.has(key)
        && ['string', 'number', 'boolean'].includes(typeof value))
      .map(([key, value]) => [key, typeof value === 'string' ? value.slice(0, 80) : value]),
  ) as Record<string, string | number | boolean>;
}

function scheduleUpload() {
  if (!transport || uploadTimer) return;
  uploadTimer = setTimeout(() => {
    uploadTimer = null;
    transport?.(getTelemetrySnapshot());
  }, 5000);
}

export function recordClientTelemetry(name: string, details: Record<string, unknown> = {}) {
  const entry: ClientTelemetryEntry = {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: name.slice(0, 60),
    details: safeDetails(details),
    timestamp: new Date().toISOString(),
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  if (ALLOWED_COUNTERS.has(name)) counters[name] = (counters[name] || 0) + 1;
  scheduleUpload();
}

export function getTelemetrySnapshot(): ClientTelemetrySnapshot {
  return { counters: { ...counters }, recent: entries.slice(-MAX_ENTRIES) };
}

export function getRecentTelemetry(limit = 20) {
  return entries.slice(-Math.min(limit, MAX_ENTRIES));
}

export function setTelemetryTransport(
  send: ((snapshot: ClientTelemetrySnapshot) => void) | null,
) {
  transport = send;
  if (transport && entries.length) scheduleUpload();
}

export function installProductionErrorSanitizer() {
  if (errorSanitizerInstalled) return;
  errorSanitizerInstalled = true;
  const safeError = console.error.bind(console);
  console.error = () => safeError('Application error occurred. Details are omitted in production.');
}

export function resetClientTelemetry() {
  entries.length = 0;
  Object.keys(counters).forEach((key) => delete counters[key]);
}
