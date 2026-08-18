import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/ScheduleBuilder.css';

const WEEK_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function ScheduleBuilder({ value = [], onChange }) {
  const [entries, setEntries] = useState(value);

  useEffect(() => {
    setEntries(value || []);
  }, [value]);

  useEffect(() => {
    onChange && onChange(entries);
  }, [entries]);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { dayOfWeek: 1, startTime: '18:00', duration: 60, id: Date.now().toString() },
    ]);
  };

  const updateEntry = (idx, patch) => {
    setEntries((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  };

  const removeEntry = (idx) => {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="schedule-builder">
      <div className="schedule-builder__list">
        {entries.length === 0 && <div className="schedule-builder__empty">No sessions yet</div>}
        {entries.map((entry, idx) => (
          <div key={entry.id || `${entry.dayOfWeek}-${entry.startTime}-${idx}`} className="schedule-builder__row">
            <select
              value={entry.dayOfWeek}
              onChange={(e) => updateEntry(idx, { dayOfWeek: Number(e.target.value) })}
            >
              {WEEK_DAYS.map((d, i) => (
                <option key={d} value={i}>{d}</option>
              ))}
            </select>

            <input
              type="time"
              value={entry.startTime}
              onChange={(e) => updateEntry(idx, { startTime: e.target.value })}
            />

            <input
              type="number"
              min={15}
              max={240}
              value={entry.duration}
              onChange={(e) => updateEntry(idx, { duration: Number(e.target.value) })}
              className="schedule-builder__duration"
            />

            <button type="button" className="schedule-builder__remove" onClick={() => removeEntry(idx)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="schedule-builder__controls">
        <button type="button" className="btn" onClick={addEntry}>Add Session</button>
        <small className="schedule-builder__hint">Sessions are recurring weekly. You can add multiple days/times.</small>
      </div>
    </div>
  );
}

ScheduleBuilder.propTypes = {
  value: PropTypes.array,
  onChange: PropTypes.func,
};
