import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import CertificatePreview from '../components/CertificatePreview';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CertificateGalleryPage.css';

const CertificateGalleryPage = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, verified, shared

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        const response = await api.get('/certificates/my-certificates');
        const data = response.data?.data || [];
        const normalized = data.map((cert) => ({
          certificateId: cert.certificateId || cert._id || cert.id,
          certificateNumber: cert.certificateNumber,
          className: cert.className || cert.courseTitle || cert.classTitle || cert.course?.title || cert.classId?.title || 'Certificate',
          completionDate: cert.completionDate || cert.issuedDate,
          issueDate: cert.issuedDate,
          verified: cert.verified || false,
          verificationCode: cert.verificationCode,
          sharesCount: cert.sharedCount || cert.sharesCount || 0,
          downloadsCount: cert.downloadCount || cert.downloadsCount || 0,
          pdfUrl: cert.pdfUrl,
          ...cert,
        }));
        setCertificates(normalized);
        if (normalized.length > 0) {
          setSelectedCertificate(normalized[0]);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch certificates');
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchCertificates();
    }
  }, [user]);

  const handleDownload = async (certificateId) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/download`);
      if (response.data?.data?.pdfUrl) {
        window.open(response.data.data.pdfUrl, '_blank');
        return;
      }

      const contentType = response.headers['content-type'];
      if (contentType === 'application/pdf') {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'certificate.pdf';
        a.click();
        window.URL.revokeObjectURL(url);
        return;
      }

      alert('Download link is not available at this time.');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download certificate');
    }
  };

  const handleShare = async (certificateId, platform = 'linkedin') => {
    try {
      const response = await api.post(`/certificates/${certificateId}/share`, null, {
        params: { platform }
      });

      if (response.data?.success) {
        alert('Certificate share link generated successfully!');
      } else {
        alert('Could not generate share link.');
      }
    } catch (err) {
      console.error('Share failed:', err);
      alert('Failed to share certificate');
    }
  };

  const handleVerify = async (verificationCode) => {
    try {
      if (!verificationCode) {
        alert('No verification code available');
        return;
      }

      const response = await api.get(`/certificates/verify/${verificationCode}`);
      if (response.data?.success) {
        alert('Certificate verified successfully!');
      } else {
        alert('Certificate verification failed');
      }
    } catch (err) {
      console.error('Verification failed:', err);
      alert('Certificate verification failed');
    }
  };

  const filteredCertificates = certificates.filter(cert => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'verified') return cert.verified;
    if (filterStatus === 'shared') return cert.sharesCount > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="certificate-gallery-page">
        <LoadingSpinner fullPage={true} message="Loading certificates..." />
      </div>
    );
  }

  return (
    <div className="certificate-gallery-page">
      <div className="certificate-gallery-page__header">
        <h1 className="certificate-gallery-page__title">My Certificates</h1>
        <p className="certificate-gallery-page__subtitle">
          Showcase your achievements and share your success
        </p>
      </div>

      {error && (
        <div className="certificate-gallery-page__error">
          <p>{error}</p>
        </div>
      )}

      <div className="certificate-gallery-page__container">
        {certificates.length === 0 ? (
          <div className="certificate-gallery-page__empty">
            <p>🎓 No certificates yet</p>
            <p className="certificate-gallery-page__empty-subtitle">
              Complete your courses to earn certificates
            </p>
          </div>
        ) : (
          <>
            {/* Filter */}
            <div className="certificate-gallery-page__controls">
              <label className="certificate-gallery-page__filter-label">Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="certificate-gallery-page__filter-select"
              >
                <option value="all">All Certificates ({certificates.length})</option>
                <option value="verified">Verified</option>
                <option value="shared">Shared</option>
              </select>
            </div>

            {/* Gallery */}
            <div className="certificate-gallery-page__grid">
              {/* Thumbnails */}
              <div className="certificate-gallery-page__thumbnails">
                <h3 className="certificate-gallery-page__section-title">Your Certificates</h3>
                <div className="certificate-gallery-page__thumbnail-list">
                  {filteredCertificates.map((cert) => (
                    <div
                      key={cert.certificateId}
                      className={`certificate-gallery-page__thumbnail ${
                        selectedCertificate?.certificateId === cert.certificateId
                          ? 'certificate-gallery-page__thumbnail--active'
                          : ''
                      }`}
                      onClick={() => setSelectedCertificate(cert)}
                    >
                      <div className="certificate-gallery-page__thumbnail-icon">🎓</div>
                      <div className="certificate-gallery-page__thumbnail-info">
                        <h4 className="certificate-gallery-page__thumbnail-title">
                          {cert.className}
                        </h4>
                        <p className="certificate-gallery-page__thumbnail-date">
                          {new Date(cert.completionDate).toLocaleDateString()}
                        </p>
                      </div>
                      {cert.verified && (
                        <div className="certificate-gallery-page__verified-badge">✓</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {selectedCertificate && (
                <div className="certificate-gallery-page__preview-section">
                  <h3 className="certificate-gallery-page__section-title">Certificate Preview</h3>
                  <CertificatePreview
                    certificate={selectedCertificate}
                    onDownload={() => handleDownload(selectedCertificate.certificateId)}
                    onShare={() => handleShare(selectedCertificate.certificateId)}
                    onVerify={() => handleVerify(selectedCertificate.verificationCode)}
                  />

                  {/* Certificate Details */}
                  <div className="certificate-gallery-page__details">
                    <div className="certificate-gallery-page__detail-row">
                      <span className="certificate-gallery-page__detail-label">Certificate ID:</span>
                      <span className="certificate-gallery-page__detail-value">
                        {selectedCertificate.certificateNumber}
                      </span>
                    </div>

                    <div className="certificate-gallery-page__detail-row">
                      <span className="certificate-gallery-page__detail-label">Issued Date:</span>
                      <span className="certificate-gallery-page__detail-value">
                        {new Date(selectedCertificate.issueDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="certificate-gallery-page__detail-row">
                      <span className="certificate-gallery-page__detail-label">Completion Date:</span>
                      <span className="certificate-gallery-page__detail-value">
                        {new Date(selectedCertificate.completionDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="certificate-gallery-page__detail-row">
                      <span className="certificate-gallery-page__detail-label">Status:</span>
                      <span className={`certificate-gallery-page__status certificate-gallery-page__status--${selectedCertificate.verified ? 'verified' : 'pending'}`}>
                        {selectedCertificate.verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>

                    <div className="certificate-gallery-page__detail-row">
                      <span className="certificate-gallery-page__detail-label">Times Shared:</span>
                      <span className="certificate-gallery-page__detail-value">
                        {selectedCertificate.sharesCount || 0}
                      </span>
                    </div>

                    <div className="certificate-gallery-page__detail-row">
                      <span className="certificate-gallery-page__detail-label">Times Downloaded:</span>
                      <span className="certificate-gallery-page__detail-value">
                        {selectedCertificate.downloadsCount || 0}
                      </span>
                    </div>
                  </div>

                  {/* Share Options */}
                  <div className="certificate-gallery-page__share-options">
                    <h4 className="certificate-gallery-page__share-title">Share On:</h4>
                    <div className="certificate-gallery-page__share-buttons">
                      <button className="certificate-gallery-page__share-button certificate-gallery-page__share-button--linkedin">
                        LinkedIn
                      </button>
                      <button className="certificate-gallery-page__share-button certificate-gallery-page__share-button--twitter">
                        Twitter
                      </button>
                      <button className="certificate-gallery-page__share-button certificate-gallery-page__share-button--facebook">
                        Facebook
                      </button>
                      <button className="certificate-gallery-page__share-button certificate-gallery-page__share-button--email">
                        Email
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateGalleryPage;
