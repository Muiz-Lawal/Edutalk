import React, { useState, useEffect } from 'react';
import '../styles/CalendarView.css';

export default function CalendarView({ schedules = [], onSelectDate, onNavigateMonth, onEditSchedule }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  
  // Color status mapping
  const getScheduleStatus = (schedule) => {
    const now = new Date();
    const start = new Date(schedule.scheduledStartTime);
    if (schedule.status === 'live' || (start <= now && schedule.status !== 'completed')) return 'live';
    if (schedule.status === 'completed') return 'completed';
    return 'scheduled';
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledStartTime);
      return (
        scheduleDate.getDate() === date.getDate() &&
        scheduleDate.getMonth() === date.getMonth() &&
        scheduleDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    if (onNavigateMonth) onNavigateMonth(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    if (onNavigateMonth) onNavigateMonth(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const daySchedules = getSchedulesForDate(date);
      const isToday = 
        date.toDateString() === new Date().toDateString();

      days.push(
        <div 
          key={day} 
          className={`calendar-day ${isToday ? 'today' : ''} ${daySchedules.length > 0 ? 'has-schedules' : ''}`}
          onClick={() => onSelectDate && onSelectDate(date)}
        >
          <div className="day-number">{day}</div>
          <div className="schedules-preview">
            {daySchedules.slice(0, 2).map((schedule, idx) => {
              const status = getScheduleStatus(schedule);
              return (
                <div 
                  key={idx} 
                  className={`schedule-preview status-${status}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEditSchedule) onEditSchedule(schedule);
                  }}
                  title={schedule.title}
                >
                  {new Date(schedule.scheduledStartTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  {schedule.title.substring(0, 10)}
                </div>
              );
            })}
            {daySchedules.length > 2 && (
              <div className="more-schedules">+{daySchedules.length - 2} more</div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="month-view">
        <div className="weekday-header">
          {weekdays.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="btn-nav">← Prev</button>
        <div className="calendar-title">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <button onClick={handleNextMonth} className="btn-nav">Next →</button>
        <button onClick={handleToday} className="btn-today">Today</button>
      </div>

      <div className="view-mode-selector">
        <button 
          className={`btn-view ${viewMode === 'month' ? 'active' : ''}`}
          onClick={() => setViewMode('month')}
        >
          Month
        </button>
        <button 
          className={`btn-view ${viewMode === 'week' ? 'active' : ''}`}
          onClick={() => setViewMode('week')}
        >
          Week
        </button>
        <button 
          className={`btn-view ${viewMode === 'day' ? 'active' : ''}`}
          onClick={() => setViewMode('day')}
        >
          Day
        </button>
      </div>

      {viewMode === 'month' && renderMonthView()}
      
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color scheduled"></div>
          <span>Scheduled</span>
        </div>
        <div className="legend-item">
          <div className="legend-color live"></div>
          <span>Live</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed"></div>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color today"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
