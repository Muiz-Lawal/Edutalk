const levelOrder = ['debug', 'info', 'warn', 'error'];
const levelRank = Object.fromEntries(levelOrder.map((level, index) => [level, index]));

const shouldLog = (level) => {
  const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return (levelRank[level] || 0) >= (levelRank[configuredLevel] ?? 1);
};

const normalizeMeta = (meta) => {
  if (!meta || Object.keys(meta).length === 0) return undefined;
  return meta;
};

const formatEntry = (level, message, meta) => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  ...(normalizeMeta(meta) || {}),
});

const emit = (level, message, meta) => {
  if (!shouldLog(level)) return;
  const entry = formatEntry(level, message, meta);

  if (level === 'error') {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(entry));
    return;
  }

  if (level === 'debug') {
    console.debug(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
};

const logger = {
  debug: (message, meta) => emit('debug', message, meta),
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};

export default logger;
