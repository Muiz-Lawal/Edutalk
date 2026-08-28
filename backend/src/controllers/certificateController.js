import Certificate from '../models/Certificate.js';
import StudentProgress from '../models/StudentProgress.js';
import Subscription from '../models/Subscription.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import generateCertificatePdf from '../utils/generateCertificatePdf.js';
import path from 'path';
import fs from 'fs';

// Generate certificate when course is completed
export const generateCertificate = async (req, res) => {
  try {
    const { enrollmentId, completionDate, courseData } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ message: 'enrollmentId is required' });
    }

    // Get enrollment data
    const subscription = await Subscription.findById(enrollmentId)
          .populate('userId')
      .populate('classId');

    if (!subscription) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Get progress data
    const progress = await StudentProgress.findOne({ enrollmentId });

    // Check if certificate already exists
    const existingCert = await Certificate.findOne({ enrollmentId });
    if (existingCert) {
      return res.status(400).json({ message: 'Certificate already issued for this enrollment' });
    }

    // Prepare certificateData with additional display-friendly fields
    const studentFullName = `${subscription.userId.firstName || ''} ${subscription.userId.lastName || ''}`.trim();
    const courseTitle = courseData?.courseTitle || subscription.classId.title;
    const className = subscription.classId.title || courseTitle;

    // Create new certificate
    const certificate = new Certificate({
      studentId: subscription.userId._id,
      classId: subscription.classId._id,
      enrollmentId,
      completionDate: completionDate || new Date(),
      certificateData: {
        studentName: studentFullName || `${subscription.userId.email}`,
        courseTitle: courseTitle,
        courseDescription: courseData?.courseDescription || subscription.classId.description,
        hoursCompleted: progress ? Math.round(progress.totalTimeSpent / 60) : 0,
        finalScore: progress?.overallScore || 0,
        instructorName: courseData?.instructorName || 'EduTalk Instructor',
        instructorTitle: courseData?.instructorTitle || 'Course Instructor',
        certificateMessage: courseData?.message || 'This certificate is awarded in recognition of successful course completion.'
      }
    });

    await certificate.save();

    // Generate a real PDF and store under uploads/certificates
    try {
      const outDir = path.resolve(process.cwd(), 'uploads', 'certificates');
      fs.mkdirSync(outDir, { recursive: true });
      const outPath = path.join(outDir, `${certificate._id}.pdf`);
      const genResult = await generateCertificatePdf({
        _id: certificate._id,
        studentName: certificate.certificateData.studentName,
        className: certificate.certificateData.courseTitle || certificate.classId?.title,
        issuedAt: certificate.issuedDate || new Date()
      }, outPath);

      // Publicly accessible url served by express static
      certificate.pdfUrl = `/uploads/certificates/${certificate._id}.pdf`;
      certificate.pdfSize = genResult.size || 0;
      await certificate.save();
    } catch (pdfErr) {
      // Fall back to preview URL if PDF generation fails
      console.error('PDF generation failed:', pdfErr);
      certificate.pdfUrl = `/api/certificates/preview/${certificate._id}`;
      certificate.pdfSize = 0;
      await certificate.save();
    }

    // Update progress status
    if (progress) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.completionPercentage = 100;
      await progress.save();
    }

    // Return the created certificate with canonical _id and pdfUrl so clients can download immediately
    const fresh = await Certificate.findById(certificate._id).lean();

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        _id: fresh._id,
        pdfUrl: fresh.pdfUrl,
        pdfSize: fresh.pdfSize || 0,
        certificateNumber: fresh.certificateNumber,
        studentId: fresh.studentId,
        classId: fresh.classId,
        issuedDate: fresh.issuedDate,
        completionDate: fresh.completionDate,
        courseTitle: fresh.certificateData?.courseTitle,
        hoursCompleted: fresh.certificateData?.hoursCompleted,
        finalScore: fresh.certificateData?.finalScore,
        instructorName: fresh.certificateData?.instructorName,
        verificationCode: fresh.verificationCode,
        downloadCount: fresh.downloadCount,
        sharedCount: fresh.sharedCount,
        status: fresh.status
      }
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Error generating certificate', error: error.message });
  }
};

// Preview certificate HTML (simple render for manual PDF printing)
export const previewCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = await Certificate.findById(certificateId)
      .populate('studentId', 'firstName lastName email')
      .populate('classId', 'title');

    if (!cert) return res.status(404).send('<h1>Certificate not found</h1>');

    const data = {
      studentName: cert.certificateData?.studentName || `${cert.studentId.firstName || ''} ${cert.studentId.lastName || ''}`.trim(),
      className: cert.classId?.title || cert.certificateData?.courseTitle,
      completionDate: cert.completionDate || cert.issuedDate,
      certificateNumber: cert.certificateNumber,
      verificationCode: cert.verificationCode,
      instructorName: cert.certificateData?.instructorName || 'EduTalk Instructor',
      certificateMessage: cert.certificateData?.certificateMessage || ''
    };

    // Minimal HTML that mirrors the frontend preview — suitable for printing to PDF
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Certificate ${data.certificateNumber}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #1f2937; }
    .container { width: 100%; max-width: 900px; margin: 40px auto; padding: 40px; border: 6px solid #b45309; background: linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%); }
    h1 { text-align: center; font-size: 32px; margin: 0 0 16px; }
    h2 { text-align: center; font-size: 28px; margin: 8px 0; }
    .intro { text-align: center; margin-top: 20px; font-size: 16px; color: #374151; }
    .details { margin-top: 32px; display:flex; justify-content:space-between; }
    .signature { text-align:center; margin-top:40px; }
    code { background:#f3f4f6; padding:4px 6px; border-radius:4px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Certificate of Completion</h1>
    <div class="intro">This is to certify that</div>
    <h2>${escapeHtml(data.studentName)}</h2>
    <div class="intro">has successfully completed the course</div>
    <h2>${escapeHtml(data.className)}</h2>
    <div class="details">
      <div>Certificate No.: <strong>${escapeHtml(data.certificateNumber)}</strong></div>
      <div>Completion Date: <strong>${new Date(data.completionDate).toLocaleDateString()}</strong></div>
    </div>
    <div class="signature">
      <div style="margin-top:40px;">${escapeHtml(data.instructorName)}</div>
      <div style="font-size:12px;color:#6b7280;">EduTalk Certification Authority</div>
    </div>
    <div style="margin-top:20px;text-align:center;font-size:12px;color:#6b7280;">Verification code: <code>${escapeHtml(data.verificationCode)}</code></div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Error rendering certificate preview:', error);
    res.status(500).send('<h1>Error rendering certificate preview</h1>');
  }
};

// Simple HTML escaper to avoid injection in preview
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Get certificate details
export const getCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId)
      .populate('studentId', 'firstName lastName email')
      .populate('classId', 'title');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Verify authorization
    if (certificate.studentId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    res.json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Error fetching certificate', error: error.message });
  }
};

// Download certificate PDF
export const downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;

    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Verify authorization
    if (certificate.studentId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (!certificate.pdfUrl) {
      return res.status(400).json({ message: 'Certificate PDF not available yet' });
    }

    // Record download
    await certificate.recordDownload();

    // If storing PDF locally, serve it
    // For now, return the URL so frontend can handle download
    res.json({
      success: true,
      data: {
        certificateNumber: certificate.certificateNumber,
        pdfUrl: certificate.pdfUrl,
        studentName: certificate.certificateData.studentName,
        courseTitle: certificate.certificateData.courseTitle
      }
    });
  } catch (error) {
    console.error('Error downloading certificate:', error);
    res.status(500).json({ message: 'Error downloading certificate', error: error.message });
  }
};

// Verify certificate (public endpoint)
export const verifyCertificate = async (req, res) => {
  try {
    const { verificationCode } = req.params;

    const certificateDetails = await Certificate.verifyCertificate(verificationCode);

    if (!certificateDetails) {
      return res.status(404).json({ message: 'Certificate not found or has been revoked' });
    }

    res.json({
      success: true,
      data: certificateDetails
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ message: 'Error verifying certificate', error: error.message });
  }
};

// Share certificate
export const shareCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const { platform } = req.query; // linkedin, twitter, facebook, email

    if (!platform || !['linkedin', 'twitter', 'facebook', 'email'].includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    const certificate = await Certificate.findById(certificateId);

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    // Verify authorization
    if (certificate.studentId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const shareLink = certificate.getShareLink(platform);
    await certificate.recordShare(platform, shareLink);

    res.json({
      success: true,
      data: {
        platform,
        shareLink
      }
    });
  } catch (error) {
    console.error('Error sharing certificate:', error);
    res.status(500).json({ message: 'Error sharing certificate', error: error.message });
  }
};

// List student's certificates
export const listCertificates = async (req, res) => {
  try {
    const { studentId } = req.params;
    const userId = studentId || req.user.id;

    // Verify authorization
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const certificates = await Certificate.find({
      studentId: userId,
      status: 'issued'
    }).populate('classId', 'title')
      .sort({ issuedDate: -1 });

    res.json({
      success: true,
      data: certificates.map(cert => ({
        certificateId: cert._id,
        certificateNumber: cert.certificateNumber,
        courseTitle: cert.certificateData.courseTitle,
        issuedDate: cert.issuedDate,
        completionDate: cert.completionDate,
        finalScore: cert.certificateData.finalScore,
        downloadCount: cert.downloadCount,
        isDownloadable: cert.isDownloadable,
        verificationCode: cert.verificationCode
      }))
    });
  } catch (error) {
    console.error('Error listing certificates:', error);
    res.status(500).json({ message: 'Error listing certificates', error: error.message });
  }
};

// Get certificate template options
export const getCertificateTemplates = async (req, res) => {
  try {
    const templates = [
      {
        id: 'default',
        name: 'Classic Gold',
        description: 'Traditional certificate with gold border',
        preview: '/templates/classic-gold.png'
      },
      {
        id: 'modern',
        name: 'Modern Minimal',
        description: 'Clean, minimalist design',
        preview: '/templates/modern-minimal.png'
      },
      {
        id: 'professional',
        name: 'Professional Blue',
        description: 'Corporate style certificate',
        preview: '/templates/professional-blue.png'
      },
      {
        id: 'colorful',
        name: 'Colorful',
        description: 'Vibrant, modern design',
        preview: '/templates/colorful.png'
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Error fetching templates', error: error.message });
  }
};

// Get certificate analytics
export const getCertificateAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const certificates = await Certificate.find({ classId });

    const totalIssued = certificates.length;
    const totalDownloads = certificates.reduce((sum, c) => sum + c.downloadCount, 0);
    const totalShares = certificates.reduce((sum, c) => sum + c.sharedCount, 0);
    
    const sharesByPlatform = {
      linkedin: 0,
      twitter: 0,
      facebook: 0,
      email: 0
    };

    certificates.forEach(cert => {
      cert.socialShares.forEach(share => {
        if (sharesByPlatform.hasOwnProperty(share.platform)) {
          sharesByPlatform[share.platform]++;
        }
      });
    });

    const averageDownloads = totalIssued > 0 ? Math.round((totalDownloads / totalIssued) * 100) / 100 : 0;
    const shareRate = totalIssued > 0 ? Math.round((totalShares / totalIssued) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalIssued,
        totalDownloads,
        totalShares,
        averageDownloads,
        shareRate,
        sharesByPlatform,
        recentCertificates: certificates.slice(-10).reverse()
      }
    });
  } catch (error) {
    console.error('Error fetching certificate analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

// Export certificates for compliance
export const exportCertificates = async (req, res) => {
  try {
    const { classId } = req.params;
    const { format = 'json' } = req.query; // json, csv

    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc || (classDoc.hostId.toString() !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const certificates = await Certificate.find({ classId })
      .populate('studentId', 'firstName lastName email')
      .populate('classId', 'title');

    if (format === 'csv') {
      const headers = ['Student Name', 'Email', 'Certificate Number', 'Course', 'Issued Date', 'Final Score', 'Downloads', 'Shares'];
      const rows = certificates.map(c => [
        `${c.studentId.firstName} ${c.studentId.lastName}`,
        c.studentId.email,
        c.certificateNumber,
        c.classId.title,
        c.issuedDate.toLocaleDateString(),
        c.certificateData.finalScore,
        c.downloadCount,
        c.sharedCount
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="certificates-export.csv"');
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: certificates,
        exportDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error exporting certificates:', error);
    res.status(500).json({ message: 'Error exporting certificates', error: error.message });
  }
};
