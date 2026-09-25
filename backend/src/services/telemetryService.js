const MAX_RECENT_ENTRIES = 20;
const counters = new Map();
const recentEntries = [];

export const recordTelemetry = (name, details = {}) => {
  counters.set(name, (counters.get(name) || 0) + 1);
  recentEntries.push({ name, details, timestamp: new Date().toISOString() });
  if (recentEntries.length > MAX_RECENT_ENTRIES) recentEntries.shift();
};

export const getTelemetrySnapshot = () => ({
  counters: Object.fromEntries(counters),
  recent: [...recentEntries].reverse(),
});

export const resetTelemetry = () => {
  counters.clear();
  recentEntries.length = 0;
};

export default { recordTelemetry, getTelemetrySnapshot, resetTelemetry };
