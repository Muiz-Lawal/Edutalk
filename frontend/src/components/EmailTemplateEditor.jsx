import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const EmailTemplateEditor = ({ templates, onSuccess }) => {
  const { updateEmailTemplate, loading } = useAdmin();
  const [selectedTemplate, setSelectedTemplate] = useState(templates?.[0] || null);
  const [subject, setSubject] = useState(selectedTemplate?.subject || '');
  const [body, setBody] = useState(selectedTemplate?.body || '');
  const [variables, setVariables] = useState(selectedTemplate?.variables || []);
  const [newVariable, setNewVariable] = useState('');
  const [error, setError] = useState(null);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
    setVariables(template.variables || []);
    setNewVariable('');
  };

  const handleAddVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variable) => {
    setVariables(variables.filter(v => v !== variable));
  };

  const handleSave = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required');
      setTimeout(() => setError(null), 4000);
      return;
    }

    const result = await updateEmailTemplate(selectedTemplate.id, {
      subject,
      body,
      variables
    });

    if (result) {
      onSuccess(`Email template "${selectedTemplate.name}" updated successfully`);
    }
  };

  return (
    <div className="email-template-editor">
      <h2>Email Templates</h2>
      {error && <div className="alert alert-error" style={{marginTop:12}}>{error}</div>}
      <p className="card-description">
        Customize email templates sent to hosts and students. Use variables for dynamic content.
      </p>

      <div className="editor-container">
        <div className="template-list">
          <h3>Templates</h3>
          {templates?.map((template) => (
            <button
              key={template.id}
              className={`template-button ${selectedTemplate?.id === template.id ? 'active' : ''}`}
              onClick={() => handleTemplateSelect(template)}
            >
              <span className="template-name">{template.name}</span>
              <span className="template-id">{template.id}</span>
            </button>
          ))}
        </div>

        <div className="template-editor">
          {selectedTemplate && (
            <>
              <div className="editor-section">
                <label>Template Name</label>
                <div className="read-only-field">{selectedTemplate.name}</div>
              </div>

              <div className="editor-section">
                <label>Subject Line</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  disabled={loading}
                  className="template-input"
                />
              </div>

              <div className="editor-section">
                <label>Email Body</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Enter email body (supports variables like {hostName})"
                  disabled={loading}
                  className="template-textarea"
                  rows="8"
                />
              </div>

              <div className="editor-section">
                <label>Template Variables</label>
                <p className="section-description">
                  These variables will be replaced with actual data when sending emails.
                </p>

                <div className="variable-input">
                  <input
                    type="text"
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    placeholder="Add a new variable (e.g., hostName, approvalDate)"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddVariable()}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={handleAddVariable}
                    className="btn btn-secondary btn-sm"
                    disabled={loading}
                  >
                    Add
                  </button>
                </div>

                <div className="variables-list">
                  {variables.map((variable) => (
                    <div key={variable} className="variable-tag">
                      <code>{'{'}{variable}{'}'}</code>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(variable)}
                        className="remove-btn"
                        disabled={loading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="editor-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Template'}
                </button>
              </div>

              <div className="template-preview">
                <h4>Preview</h4>
                <div className="preview-section">
                  <strong>Subject:</strong>
                  <p>{subject}</p>
                </div>
                <div className="preview-section">
                  <strong>Body:</strong>
                  <p>{body}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="template-guidelines">
        <h4>📝 Template Guidelines</h4>
        <ul>
          <li>Use variables in curly braces: <code>{'{'}variable_name{'}'}</code></li>
          <li>Common variables: hostName, email, approvalDate, reason, duration</li>
          <li>Keep subject lines under 60 characters for mobile display</li>
          <li>Include clear CTA (Call To Action) in email body</li>
          <li>Test emails are sent to your admin email address</li>
        </ul>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;