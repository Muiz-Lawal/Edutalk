import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  generateCertificate,
  getCertificate,
  downloadCertificate,
  verifyCertificate,
  shareCertificate,
  listCertificates,
  getCertificateTemplates,
  getCertificateAnalytics,
  exportCertificates
} from '../controllers/certificateController.js';

const router = express.Router();

// Public endpoint - verify certificate (no auth required)
router.get('/verify/:verificationCode', verifyCertificate);

// Protected endpoints
router.use(authenticateToken);

// Specific routes MUST come before generic /:id routes
router.get('/templates/all', getCertificateTemplates);

router.get('/my-certificates', (req, res, next) => {
  req.params.studentId = req.user.id;
  next();
}, listCertificates);

router.get('/student/:studentId', listCertificates);

router.get('/analytics/:classId', getCertificateAnalytics);

router.get('/export/:classId', exportCertificates);

// List all certificates for current user
router.get('/', listCertificates);

// Generate certificate
router.post('/', generateCertificate);

// Generic routes MUST come last
router.get('/:certificateId/download', downloadCertificate);
router.post('/:certificateId/share', shareCertificate);
router.get('/:certificateId', getCertificate);

export default router;
