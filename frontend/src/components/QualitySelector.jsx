import '../styles/QualitySelector.css';

export default function QualitySelector({ options, selected, onChange }) {
  const formatQualityOption = (option) => {
    if (typeof option === 'string') return option;
    if (typeof option === 'number') return `${option}p`;
    if (option.name) return option.name;
    if (option.height) return `${option.height}p`;
    if (option.bitrate) return `${Math.round(option.bitrate / 1000)} kbps`;
    return String(option);
  };

  return (
    <div className="quality-selector-container">
      <label htmlFor="quality-select" className="quality-label">
        Video Quality
      </label>
      <select
        id="quality-select"
        value={selected || 'auto'}
        onChange={(e) => onChange(e.target.value)}
        className="quality-select"
      >
        <option value="auto">📶 Auto (Recommended)</option>
        {options && options.length > 0 ? (
          options.map((option, index) => {
            const label = formatQualityOption(option);
            const value = typeof option === 'string' ? option : label;
            return (
              <option key={index} value={value}>
                {label}
              </option>
            );
          })
        ) : (
          <>
            <option value="1080p">📺 1080p (Full HD)</option>
            <option value="720p">📺 720p (HD)</option>
            <option value="480p">📱 480p (Mobile)</option>
          </>
        )}
      </select>
      <small className="quality-hint">
        Your connection speed will auto-adjust playback quality
      </small>
    </div>
  );
}
