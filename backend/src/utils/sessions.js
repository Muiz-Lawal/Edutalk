import { addDays, addWeeks, eachDayOfInterval, format, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

const toDate = (value) => value instanceof Date ? value : parseISO(value);

export function generateSessionsForFixed(classData, schedules) {
  const timezone = classData.timezone || 'UTC';
  const sessions = [];
  for (const day of eachDayOfInterval({ start: toDate(classData.startDate), end: toDate(classData.endDate) })) {
    for (const schedule of schedules.filter((item) => item.dayOfWeek === day.getDay())) {
      const start = fromZonedTime(`${format(day, 'yyyy-MM-dd')}T${schedule.startTime}:00`, timezone);
      const end = new Date(start.getTime() + (schedule.durationMinutes || schedule.duration || 60) * 60000);
      sessions.push({ startUtc: start, endUtc: end, status: 'scheduled', timezone });
    }
  }
  return sessions.sort((a, b) => a.startUtc - b.startUtc);
}

export function generateSessionsOngoing(classData, schedules, fromDate, weeks = 8) {
  return generateSessionsForFixed({
    ...classData,
    startDate: fromDate,
    endDate: addWeeks(toDate(fromDate), weeks),
  }, schedules);
}

export function dedupeSessions(existing, generated) {
  const seen = new Set(existing.map((session) => new Date(session.startUtc).toISOString()));
  return [...existing, ...generated.filter((session) => !seen.has(new Date(session.startUtc).toISOString()))];
}

export function getFutureSessions(sessions, now = new Date()) {
  return sessions.filter((session) => new Date(session.startUtc) > now);
}
