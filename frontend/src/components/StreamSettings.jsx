import { useState } from 'react';
import '../styles/StreamSettings.css';

export default function StreamSettings({ onCreateStream, loading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Stream title is required';
    } else if (title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    if (!duration || isNaN(duration) || duration < 15 || duration > 480) {
      newErrors.duration = 'Duration must be between 15 and 480 minutes';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onCreateStream(title, description, parseInt(duration));
  };

  return (
    <form onSubmit={handleSubmit} className="stream-settings">
      <div className="settings-card">
        <h2>📝 Configure Your Stream</h2>

        <div className="form-group">
          <label htmlFor="title">
            Stream Title <span className="required">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Advanced JavaScript Fundamentals"
            maxLength="100"
            className={errors.title ? 'error' : ''}
            disabled={loading}
          />
          {errors.title && <span className="error-text">{errors.title}</span>}
          <span className="char-count">{title.length}/100</span>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will you teach today? (optional)"
            rows="4"
            maxLength="500"
            className={errors.description ? 'error' : ''}
            disabled={loading}
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
          <span className="char-count">{description.length}/500</span>
        </div>

        <div className="form-group">
          <label htmlFor="duration">
            Expected Duration <span className="required">*</span>
          </label>
          <div className="duration-input">
            <input
              id="duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="15"
              max="480"
              step="15"
              className={errors.duration ? 'error' : ''}
              disabled={loading}
            />
            <span className="unit">minutes</span>
          </div>
          {errors.duration && <span className="error-text">{errors.duration}</span>}
          <span className="help-text">15 - 480 minutes (15 min increments)</span>
        </div>

        <div className="form-group">
          <label htmlFor="quality">Video Quality</label>
          <div className="quality-info">
            <div className="quality-option">
              <input type="radio" id="auto" name="quality" value="auto" defaultChecked disabled />
              <label htmlFor="auto">
                <strong>Auto (Recommended)</strong>
                <span>Automatically adjusts based on viewer network</span>
              </label>
            </div>
            <div className="quality-option">
              <input type="radio" id="1080p" name="quality" value="1080p" disabled />
              <label htmlFor="1080p">
                <strong>1080p (Best)</strong>
                <span>Higher quality, requires better bandwidth</span>
              </label>
            </div>
            <div className="quality-option">
              <input type="radio" id="720p" name="quality" value="720p" disabled />
              <label htmlFor="720p">
                <strong>720p (Good)</strong>
                <span>Balanced quality and bandwidth</span>
              </label>
            </div>
          </div>
        </div>

        <div className="tips-section">
          <h4>💡 Tips for Better Streams</h4>
          <ul>
            <li>Ensure you have a stable internet connection (10 Mbps upload recommended)</li>
            <li>Use a quality microphone for better audio</li>
            <li>Ensure good lighting on your face</li>
            <li>Test your audio and video before going live</li>
          </ul>
        </div>

        <button type="submit" className="btn-primary btn-large" disabled={loading}>
          {loading ? '⏳ Creating Stream...' : '🎬 Create Stream'}
        </button>
      </div>
    </form>
  );
}
