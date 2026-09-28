import express from 'express';
import rateLimit from 'express-rate-limit';
import { ingestClientTelemetry, recordClientErrorReport } from '../services/telemetryService.js';

const router = express.Router();

router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false }));
router.post('/', (req, res) => {
  ingestClientTelemetry(req.body);
  return res.status(202).json({ accepted: true });
});

router.post('/errors', (req, res) => {
  recordClientErrorReport(req.body || {});
  return res.status(202).json({ accepted: true });
});

export default router;
