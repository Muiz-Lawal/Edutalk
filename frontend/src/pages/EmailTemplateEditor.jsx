import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import MessageBanner from '../components/MessageBanner';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../utils/api';
import '../styles/EmailTemplateEditor.css';

const EMAIL_CATEGORIES = [
  'certificate',
  'achievement',
  'progress',
  'enrollment',
  'class',
  'payment',
  'admin',
  'system',
];

export default function EmailTemplateEditor() {
  const { user, isAuthenticated, loading } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    htmlContent: '',
    textContent: '',
    category: 'system',
  });
  const [variables, setVariables] = useState([]);
  const [newVariable, setNewVariable] = useState({ name: '', description: '', defaultValue: '' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  if (loading) {
    return <LoadingSpinner fullPage={true} message="Loading email templates..." />;
  }

  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/email/templates');
      setTemplates(response.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
      category: template.category,
    });
    setVariables(template.variables || []);
    setIsCreating(false);
    setError(null);
    setSuccess(null);
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      subject: '',
      htmlContent: '',
      textContent: '',
      category: 'system',
    });
    setVariables([]);
    setIsCreating(true);
    setError(null);
    setSuccess(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddVariable = () => {
    if (newVariable.name.trim()) {
      setVariables(prev => [...prev, { ...newVariable }]);
      setNewVariable({ name: '', description: '', defaultValue: '' });
    }
  };

  const handleRemoveVariable = (index) => {
    setVariables(prev => prev.filter((_, i) => i !== index));
  };

  const handlePreview = async () => {
    try {
      setPreview(null);
      const previewData = {};
      variables.forEach(v => {
        previewData[v.name] = v.defaultValue || `[${v.name}]`;
      });

      // Manually interpolate since we're in editing mode
      const subject = interpolate(formData.subject, previewData);
      const htmlContent = interpolate(formData.htmlContent, previewData);

      setPreview({ subject, htmlContent });
      setShowPreview(true);
    } catch (err) {
      setError('Error generating preview');
    }
  };

  const interpolate = (template, variables) => {
    let result = template;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, variables[key] || '');
    });
    return result;
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Template name is required');
      return;
    }

    if (!formData.subject.trim()) {
      setError('Email subject is required');
      return;
    }

    if (!formData.htmlContent.trim()) {
      setError('HTML content is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        variables,
      };

      if (isCreating) {
        await api.post('/email/templates', payload);
        setSuccess('Template created successfully');
      } else {
        await api.put(`/email/templates/${selectedTemplate._id}`, payload);
        setSuccess('Template updated successfully');
      }

      setTimeout(() => {
        fetchTemplates();
        if (isCreating) {
          handleNewTemplate();
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const [confirm, setConfirm] = React.useState({ open: false, title: '', message: '', onConfirm: null });

  const handleDelete = () => {
    if (!selectedTemplate) return;

    setConfirm({
      open: true,
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template?',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await api.delete(`/email/templates/${selectedTemplate._id}`);
          setSuccess('Template deleted successfully');
          setTimeout(() => {
            fetchTemplates();
            setSelectedTemplate(null);
          }, 1000);
        } catch (err) {
          setError('Error deleting template');
        }
      },
    });
  };

  return (
    <div className="email-template-editor">
      <div className="container">
        <h1>Email Template Editor</h1>
        <p className="subtitle">Create and manage email templates with variable interpolation</p>

        {error && (
          <MessageBanner
            type="error"
            title="Template save failed"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <MessageBanner
            type="success"
            title="Template saved"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        <ConfirmDialog
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm({ open: false })}
        />

        <div className="editor-layout">
          {/* Template List Sidebar */}
          <aside className="template-list-sidebar">
            <div className="sidebar-header">
              <h2>Templates</h2>
              <button onClick={handleNewTemplate} className="btn btn-primary btn-sm">
                + New Template
              </button>
            </div>

            <div className="template-filters">
              <label>Filter by category:</label>
              <select className="category-filter" defaultValue="">
                <option value="">All Categories</option>
                {EMAIL_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="template-list">
              {templates.length === 0 ? (
                <p className="no-templates">No templates yet</p>
              ) : (
                templates.map(template => (
                  <div
                    key={template._id}
                    className={`template-item ${selectedTemplate?._id === template._id ? 'active' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <h3>{template.name}</h3>
                    <p className="category-badge">{template.category}</p>
                    <p className="template-preview">{template.subject}</p>
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* Editor Panel */}
          <main className="template-editor">
            {!selectedTemplate && !isCreating ? (
              <div className="no-selection">
                <p>Select a template to edit or create a new one</p>
              </div>
            ) : (
              <div className="editor-form">
                <div className="form-section">
                  <h2>Template Information</h2>

                  <div className="form-group">
                    <label htmlFor="name">Template Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g., Certificate Issued"
                      disabled={!isCreating && selectedTemplate?.isSystem}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="What is this template for?"
                      disabled={!isCreating && selectedTemplate?.isSystem}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Category</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        disabled={!isCreating && selectedTemplate?.isSystem}
                      >
                        {EMAIL_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Email Content */}
                <div className="form-section">
                  <h2>Email Content</h2>

                  <div className="form-group">
                    <label htmlFor="subject">Email Subject *</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="e.g., Your certificate is ready - {{courseName}}"
                      disabled={!isCreating && selectedTemplate?.isSystem}
                    />
                    <small>Use {{variable}} syntax for dynamic content</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="htmlContent">HTML Content *</label>
                    <textarea
                      id="htmlContent"
                      name="htmlContent"
                      value={formData.htmlContent}
                      onChange={handleInputChange}
                      placeholder="<h1>Congratulations!</h1><p>You have completed {{courseName}}</p>"
                      rows={12}
                      disabled={!isCreating && selectedTemplate?.isSystem}
                    />
                    <small>Full HTML is supported. Use {{variable}} for dynamic content.</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="textContent">Text Content</label>
                    <textarea
                      id="textContent"
                      name="textContent"
                      value={formData.textContent}
                      onChange={handleInputChange}
                      placeholder="Plain text version (optional)"
                      rows={8}
                      disabled={!isCreating && selectedTemplate?.isSystem}
                    />
                    <small>Plain text version for clients that don't support HTML</small>
                  </div>
                </div>

                {/* Variables */}
                <div className="form-section">
                  <h2>Template Variables</h2>
                  <p className="section-help">Define variables that can be used in the template</p>

                  <div className="variables-list">
                    {variables.length === 0 ? (
                      <p className="no-variables">No variables yet</p>
                    ) : (
                      variables.map((v, idx) => (
                        <div key={idx} className="variable-item">
                          <div className="variable-info">
                            <strong>{`{{${v.name}}}`}</strong>
                            {v.description && <span>{v.description}</span>}
                            {v.defaultValue && <span className="default">Default: {v.defaultValue}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariable(idx)}
                            className="btn-remove"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="add-variable-form">
                    <input
                      type="text"
                      value={newVariable.name}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Variable name (e.g., studentName)"
                    />
                    <input
                      type="text"
                      value={newVariable.description}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description (optional)"
                    />
                    <input
                      type="text"
                      value={newVariable.defaultValue}
                      onChange={(e) => setNewVariable(prev => ({ ...prev, defaultValue: e.target.value }))}
                      placeholder="Default value (optional)"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariable}
                      className="btn btn-secondary"
                    >
                      Add Variable
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="form-actions">
                  <button
                    onClick={handlePreview}
                    className="btn btn-secondary"
                  >
                    📧 Preview
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? 'Saving...' : (isCreating ? 'Create Template' : 'Save Changes')}
                  </button>
                  {selectedTemplate && !selectedTemplate.isSystem && (
                    <button
                      onClick={handleDelete}
                      className="btn btn-danger"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Preview Modal */}
        {showPreview && preview && (
          <div className="preview-modal" onClick={() => setShowPreview(false)}>
            <div className="preview-content" onClick={(e) => e.stopPropagation()}>
              <div className="preview-header">
                <h2>Email Preview</h2>
                <button onClick={() => setShowPreview(false)} className="close-btn">×</button>
              </div>

              <div className="preview-body">
                <div className="preview-section">
                  <h3>Subject:</h3>
                  <p className="subject-preview">{preview.subject}</p>
                </div>

                <div className="preview-section">
                  <h3>Email Body:</h3>
                  <iframe
                    srcDoc={`<div style="font-family: Arial, sans-serif; padding: 20px;">${preview.htmlContent}</div>`}
                    style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
