import {
  addDays,
  addWeeks,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isAfter,
  isBefore,
  parseISO,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export type ScheduleRow = {
  dayOfWeek: number;
  startTime: string;
  durationMinutes?: number;
  duration?: number;
};

export type SessionOccurrence = {
  classId?: string;
  startUtc: string;
  endUtc: string;
  status: string;
  timezone?: string;
};

const dateOnly = (value: string | Date) => typeof value === 'string' ? parseISO(value) : value;
export function zonedSessionStart(date: Date, time: string, timezone: string): Date {
  return fromZonedTime(`${format(date, 'yyyy-MM-dd')}T${time}:00`, timezone);
}

export function generateSessionsForFixed(
  classData: { _id?: string; startDate: string | Date; endDate: string | Date; timezone?: string },
  schedules: ScheduleRow[],
): SessionOccurrence[] {
  const timezone = classData.timezone || 'UTC';
  const start = dateOnly(classData.startDate);
  const end = dateOnly(classData.endDate);
  const sessions: SessionOccurrence[] = [];
  for (const day of eachDayOfInterval({ start, end })) {
    for (const schedule of schedules.filter((item) => item.dayOfWeek === day.getDay())) {
      const startUtc = zonedSessionStart(day, schedule.startTime, timezone);
      const endUtc = new Date(startUtc.getTime() + (schedule.durationMinutes || schedule.duration || 60) * 60000);
      sessions.push({ classId: classData._id, startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString(), status: 'scheduled', timezone });
    }
  }
  return sessions.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

export function generateSessionsOngoing(
  classData: { _id?: string; timezone?: string },
  schedules: ScheduleRow[],
  fromDate: Date,
  weeks = 8,
): SessionOccurrence[] {
  const timezone = classData.timezone || 'UTC';
  const start = dateOnly(fromDate);
  const end = addWeeks(start, weeks);
  const sessions: SessionOccurrence[] = [];
  for (const day of eachDayOfInterval({ start, end })) {
    for (const schedule of schedules.filter((item) => item.dayOfWeek === day.getDay())) {
      const startUtc = zonedSessionStart(day, schedule.startTime, timezone);
      const endUtc = new Date(startUtc.getTime() + (schedule.durationMinutes || schedule.duration || 60) * 60000);
      sessions.push({ classId: classData._id, startUtc: startUtc.toISOString(), endUtc: endUtc.toISOString(), status: 'scheduled', timezone });
    }
  }
  return sessions.sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

export function extendWindow(existing: SessionOccurrence[], generated: SessionOccurrence[]): SessionOccurrence[] {
  const keys = new Set(existing.map((session) => session.startUtc));
  return [...existing, ...generated.filter((session) => !keys.has(session.startUtc))]
    .sort((a, b) => a.startUtc.localeCompare(b.startUtc));
}

export function getClassStatus(classData: any, now = new Date(), timezone = classData.timezone || 'UTC') {
  if (classData.status && !['active', 'published'].includes(classData.status)) return classData.status;
  if (classData.durationType === 'ongoing') return 'Ongoing — join anytime';
  const start = parseISO(classData.startDate);
  const end = parseISO(classData.endDate);
  if (isBefore(now, start)) return `Starts ${formatInTimeZone(start, timezone, 'MMM d, yyyy')} (in ${differenceInCalendarDays(start, now)} days)`;
  if (isAfter(now, end)) return 'This class has ended';
  return `In progress — ${Math.max(0, differenceInCalendarDays(end, now))} days left`;
}

export function getEnrollmentDayLimits(classData: any, today = new Date()) {
  const min = Number(classData.minPurchaseDays || 1);
  if (classData.durationType === 'ongoing') return { min, max: 30, endingSoon: false };
  const end = parseISO(classData.endDate);
  const max = Math.max(0, differenceInCalendarDays(end, today) + 1);
  return { min, max, endingSoon: max < min };
}

export function getSessionsInAccessWindow(sessions: SessionOccurrence[], startDate: Date, days: number) {
  const endDate = addDays(startDate, days - 1);
  return sessions.filter((session) => {
    const startUtc = session.startUtc || (session as SessionOccurrence & { scheduledStartTime?: string }).scheduledStartTime;
    if (!startUtc) return false;
    const date = format(parseISO(startUtc), 'yyyy-MM-dd');
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    return session.status !== 'cancelled' && date >= start && date <= end;
  });
}

export function formatSessionSummary(sessions: SessionOccurrence[], timezone: string) {
  return sessions.map((session) => {
    const startUtc = session.startUtc || (session as SessionOccurrence & { scheduledStartTime?: string }).scheduledStartTime;
    return startUtc ? formatInTimeZone(startUtc, timezone, 'MMM d, h:mm a') : null;
  }).filter(Boolean).join(', ');
}
