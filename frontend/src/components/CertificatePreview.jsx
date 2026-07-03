import React from 'react';
import '../styles/CertificatePreview.css';

const CertificatePreview = ({ 
  certificate, 
  onDownload, 
  onShare,
  onVerify 
}) => {
  const {
    certificateNumber,
    studentName,
    className,
    completionDate,
    verificationCode,
    issueDate,
    template = 'classic'
  } = certificate || {};

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="certificate-preview">
      <div className={`certificate-preview__container certificate-preview__container--${template}`}>
        {/* Certificate Border */}
        <div className="certificate-preview__border">
          <div className="certificate-preview__inner-border"></div>
        </div>

        {/* Certificate Content */}
        <div className="certificate-preview__content">
          {/* Header */}
          <div className="certificate-preview__header">
            <div className="certificate-preview__logo">
              <div className="certificate-preview__logo-text">EduTalk</div>
            </div>
            <h1 className="certificate-preview__title">Certificate of Completion</h1>
          </div>

          {/* Body Text */}
          <div className="certificate-preview__body">
            <p className="certificate-preview__intro">This is to certify that</p>
            
            <h2 className="certificate-preview__student-name">{studentName || 'Student Name'}</h2>
            
            <p className="certificate-preview__body-text">
              has successfully completed the course
            </p>
            
            <h3 className="certificate-preview__class-name">{className || 'Course Name'}</h3>
            
            <p className="certificate-preview__body-text">
              with dedication and excellence
            </p>
          </div>

          {/* Details */}
          <div className="certificate-preview__details">
            <div className="certificate-preview__detail-item">
              <span className="certificate-preview__detail-label">Date of Completion</span>
              <span className="certificate-preview__detail-value">
                {completionDate ? formatDate(completionDate) : 'TBD'}
              </span>
            </div>
            <div className="certificate-preview__detail-item">
              <span className="certificate-preview__detail-label">Certificate No.</span>
              <span className="certificate-preview__detail-value">{certificateNumber || 'N/A'}</span>
            </div>
          </div>

          {/* Verification Code */}
          <div className="certificate-preview__verification">
            <p className="certificate-preview__verification-text">
              Verification Code: <code>{verificationCode || 'N/A'}</code>
            </p>
          </div>

          {/* Signature Line */}
          <div className="certificate-preview__signature">
            <div className="certificate-preview__signature-line"></div>
            <p className="certificate-preview__signature-text">EduTalk Certification Authority</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="certificate-preview__actions">
        {onDownload && (
          <button 
            className="certificate-preview__button certificate-preview__button--primary"
            onClick={onDownload}
            title="Download certificate as PDF"
          >
            📥 Download
          </button>
        )}
        {onShare && (
          <button 
            className="certificate-preview__button certificate-preview__button--secondary"
            onClick={onShare}
            title="Share certificate on social media"
          >
            🔗 Share
          </button>
        )}
        {onVerify && (
          <button 
            className="certificate-preview__button certificate-preview__button--tertiary"
            onClick={onVerify}
            title="Verify certificate authenticity"
          >
            ✓ Verify
          </button>
        )}
      </div>
    </div>
  );
};

export default CertificatePreview;
