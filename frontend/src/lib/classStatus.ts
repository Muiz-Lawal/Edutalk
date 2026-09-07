import { differenceInCalendarDays, isAfter, isBefore, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export function getClassStatus(classData: any, now = new Date(), timezone = classData.timezone || 'UTC') {
  if (classData.status && !['active', 'published'].includes(classData.status)) return classData.status;
  if (classData.durationType === 'ongoing') return 'Ongoing — join anytime';
  const start = parseISO(classData.startDate);
  const end = parseISO(classData.endDate);
  if (isBefore(now, start)) return `Starts ${formatInTimeZone(start, timezone, 'MMM d, yyyy')} (in ${differenceInCalendarDays(start, now)} days)`;
  if (isAfter(now, end)) return 'This class has ended';
  return `In progress — ${Math.max(0, differenceInCalendarDays(end, now))} days left`;
}
