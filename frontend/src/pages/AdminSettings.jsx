import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import CommissionRateCard from '../components/CommissionRateCard';
import EmailTemplateEditor from '../components/EmailTemplateEditor';
import FeatureFlagToggle from '../components/FeatureFlagToggle';
import AuditLogViewer from '../components/AuditLogViewer';
import '../styles/admin-settings.css';

export const AdminSettings = () => {
  const {
    loading,
    error,
    fetchCommissionSettings,
    fetchEmailTemplates,
    fetchFeatureFlags,
    fetchAuditLogs
  } = useAdmin();

  const [activeTab, setActiveTab] = useState('commission');
  const [commissionSettings, setCommissionSettings] = useState(null);
  const [emailTemplates, setEmailTemplates] = useState(null);
  const [featureFlags, setFeatureFlags] = useState(null);
  const [auditLogs, setAuditLogs] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Load commission settings
  useEffect(() => {
    const loadCommissionSettings = async () => {
      const data = await fetchCommissionSettings();
      if (data) {
        setCommissionSettings(data);
      }
    };
    loadCommissionSettings();
  }, [fetchCommissionSettings]);

  // Load email templates
  useEffect(() => {
    const loadEmailTemplates = async () => {
      const data = await fetchEmailTemplates();
      if (data) {
        setEmailTemplates(data);
      }
    };
    loadEmailTemplates();
  }, [fetchEmailTemplates]);

  // Load feature flags
  useEffect(() => {
    const loadFeatureFlags = async () => {
      const data = await fetchFeatureFlags();
      if (data) {
        setFeatureFlags(data);
      }
    };
    loadFeatureFlags();
  }, [fetchFeatureFlags]);

  // Load audit logs (page 1)
  useEffect(() => {
    const loadAuditLogs = async () => {
      const data = await fetchAuditLogs(1, 50);
      if (data) {
        setAuditLogs(data);
      }
    };
    loadAuditLogs();
  }, [fetchAuditLogs]);

  const handleSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="admin-settings-container">
      <div className="settings-header">
        <h1>Settings & Configuration</h1>
        <p>Manage platform settings, commission rates, email templates, and feature flags</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'commission' ? 'active' : ''}`}
          onClick={() => setActiveTab('commission')}
        >
          💰 Commission Rates
        </button>
        <button
          className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          📧 Email Templates
        </button>
        <button
          className={`tab-button ${activeTab === 'flags' ? 'active' : ''}`}
          onClick={() => setActiveTab('flags')}
        >
          🚩 Feature Flags
        </button>
        <button
          className={`tab-button ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📋 Audit Logs
        </button>
      </div>

      <div className="settings-content">
        {loading && <div className="loading">Loading settings...</div>}

        {!loading && activeTab === 'commission' && commissionSettings && (
          <CommissionRateCard
            settings={commissionSettings}
            onSuccess={handleSuccess}
          />
        )}

        {!loading && activeTab === 'email' && emailTemplates && (
          <EmailTemplateEditor
            templates={emailTemplates.templates}
            onSuccess={handleSuccess}
          />
        )}

        {!loading && activeTab === 'flags' && featureFlags && (
          <FeatureFlagToggle
            flags={featureFlags.flags}
            onSuccess={handleSuccess}
          />
        )}

        {!loading && activeTab === 'audit' && auditLogs && (
          <AuditLogViewer logs={auditLogs} />
        )}
      </div>
    </div>
  );
};

export default AdminSettings;
