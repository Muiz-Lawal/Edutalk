import express from 'express';
import { getLastPreview } from '../utils/mailer.js';

const router = express.Router();

router.get('/mail', (req, res) => {
  if (process.env.NODE_ENV !== 'development') return res.status(404).send('Not found');
  const preview = getLastPreview();
  if (!preview) return res.status(404).send('No email preview available');
  res.type('html').send(preview.html);
});

export default router;
