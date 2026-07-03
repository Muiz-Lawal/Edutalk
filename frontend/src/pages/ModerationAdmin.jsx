import React, { useState } from 'react';
import ModerationQueue from '../components/ModerationQueue';
import ModerationStats from '../components/ModerationStats';
import '../styles/ModerationAdmin.css';

const ModerationAdmin = () => {
  const [activeTab, setActiveTab] = useState('queue');

  return (
    <div className="moderation-admin">
      <div className="ma-container">
        <div className="ma-header">
          <h1>Moderation Administration</h1>
          <p className="ma-subtitle">Manage user-generated content, review flagged items, and monitor moderation statistics</p>
        </div>

        <div className="ma-tabs">
          <button
            className={`ma-tab ${activeTab === 'queue' ? 'ma-tab--active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            📋 Moderation Queue
          </button>
          <button
            className={`ma-tab ${activeTab === 'stats' ? 'ma-tab--active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistics
          </button>
        </div>

        <div className="ma-content">
          {activeTab === 'queue' && (
            <div className="ma-section">
              <div className="ma-section-header">
                <h2>Content Review Queue</h2>
                <p>Review and approve/reject flagged content items. Items are automatically flagged based on content moderation policies.</p>
              </div>
              <ModerationQueue />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="ma-section">
              <div className="ma-section-header">
                <h2>Moderation Insights</h2>
                <p>Monitor moderation performance, review trends, and system effectiveness over different time periods.</p>
              </div>
              <ModerationStats />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModerationAdmin;