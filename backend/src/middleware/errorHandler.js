import { getTelemetrySnapshot, recordTelemetry } from '../services/telemetryService.js';

export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (process.env.NODE_ENV === 'development') {
    console.error('Request failed:', err?.stack || err);
  } else {
    console.error('Request failed', { status });
  }
  recordTelemetry('error', { status, code: err.code });
  
  const message = status === 404
    ? 'We could not find that page or resource.'
    : status === 401
      ? 'Please sign in to continue.'
      : status === 403
        ? 'You do not have permission to do that.'
        : status < 500
          ? 'Please check your information and try again.'
          : 'The server is having trouble. Please try again shortly.';
  res.status(status).json({
    message,
    error: {},
    telemetry: { recent: getTelemetrySnapshot().recent },
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'We could not find that page or resource.' });
};
