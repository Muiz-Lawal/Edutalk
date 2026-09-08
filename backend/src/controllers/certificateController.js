import Certificate from '../models/Certificate.js';
import StudentProgress from '../models/StudentProgress.js';
import Subscription from '../models/Subscription.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

// Generate certificate when course is completed
export const generateCertificate = async (req, res) => {
  try {
    const { enrollmentId, completionDate, courseData } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ message: 'enrollmentId is required' });
    }

    // Get enrollment data
    const subscription = await Subscription.findById(enrollmentId)
      .populate('studentId')
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

    // Create new certificate
    const certificate = new Certificate({
      studentId: subscription.studentId._id,
      classId: subscription.classId._id,
      enrollmentId,
      completionDate: completionDate || new Date(),
      certificateData: {
        courseTitle: courseData?.courseTitle || subscription.classId.title,
        courseDescription: courseData?.courseDescription || subscription.classId.description,
        hoursCompleted: progress ? Math.round(progress.totalTimeSpent / 60) : 0,
        finalScore: progress?.overallScore || 0,
        instructorName: courseData?.instructorName || 'EduTalk Instructor',
        instructorTitle: courseData?.instructorTitle || 'Course Instructor',
        certificateMessage: courseData?.message || 'This certificate is awarded in recognition of successful course completion.'
      }
    });

    await certificate.save();

    // Update progress status
    if (progress) {
      progress.status = 'completed';
      progress.completedAt = new Date();
      progress.completionPercentage = 100;
      await progress.save();
    }

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: certificate.getCertificateDetails()
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Error generating certificate', error: error.message });
  }
};

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

    // If requester is finance_admin, restrict view to non-PII fields
    const isFinance = req.user?.adminRole === 'finance_admin';
    if (isFinance && certificate.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied for finance role' });
    }

    let responseData = certificate;
    if (isFinance) {
      responseData = {
        id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        courseTitle: certificate.certificateData?.courseTitle,
        completionDate: certificate.completionDate,
        issuedDate: certificate.issuedDate
      };
    }

    res.json({
      success: true,
      data: responseData
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

    // If requester is finance_admin and not the student owner, deny download
    const isFinance = req.user?.adminRole === 'finance_admin';
    if (isFinance && certificate.studentId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied for finance role' });
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

    const isFinance = req.user?.adminRole === 'finance_admin';

    res.json({
      success: true,
      data: certificates.map(cert => {
        const base = {
          certificateId: cert._id,
          certificateNumber: cert.certificateNumber,
          courseTitle: cert.certificateData.courseTitle,
          issuedDate: cert.issuedDate,
          completionDate: cert.completionDate,
          finalScore: cert.certificateData.finalScore,
          downloadCount: cert.downloadCount,
          isDownloadable: cert.isDownloadable,
          verificationCode: cert.verificationCode
        };
        if (isFinance && userId !== req.user.id) {
          // Strip any PII
          delete base.verificationCode;
          delete base.isDownloadable;
        }
        return base;
      })
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

    const isFinance = req.user?.adminRole === 'finance_admin';

    if (format === 'csv') {
      // Decide headers and rows based on requester role
      let headers;
      let rows;
      if (isFinance) {
        headers = ['Certificate Number', 'Course', 'Issued Date', 'Final Score', 'Downloads', 'Shares'];
        rows = certificates.map(c => [
          c.certificateNumber,
          c.classId.title,
          c.issuedDate.toLocaleDateString(),
          c.certificateData.finalScore,
          c.downloadCount,
          c.sharedCount
        ]);
      } else {
        headers = ['Student Name', 'Email', 'Certificate Number', 'Course', 'Issued Date', 'Final Score', 'Downloads', 'Shares'];
        rows = certificates.map(c => [
          `${c.studentId.firstName} ${c.studentId.lastName}`,
          c.studentId.email,
          c.certificateNumber,
          c.classId.title,
          c.issuedDate.toLocaleDateString(),
          c.certificateData.finalScore,
          c.downloadCount,
          c.sharedCount
        ]);
      }

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="certificates-export.csv"');
      res.send(csv);
    } else {
      // JSON export: mask student info for finance_admin
      let payload = certificates;
      if (isFinance) {
        payload = certificates.map(c => ({
          id: c._id,
          certificateNumber: c.certificateNumber,
          courseTitle: c.classId.title,
          issuedDate: c.issuedDate,
          finalScore: c.certificateData.finalScore,
          downloads: c.downloadCount,
          shares: c.sharedCount,
        }));
      }

      res.json({
        success: true,
        data: payload,
        exportDate: new Date()
      });
    }
  } catch (error) {
    console.error('Error exporting certificates:', error);
    res.status(500).json({ message: 'Error exporting certificates', error: error.message });
  }
};
