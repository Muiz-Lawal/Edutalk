import { getTelemetrySnapshot, recordTelemetry } from '../services/telemetryService.js';

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  recordTelemetry('error', { message: err.message, path: req.originalUrl, method: req.method });
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
    telemetry: { recent: getTelemetrySnapshot().recent },
  });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: 'Route not found' });
};
