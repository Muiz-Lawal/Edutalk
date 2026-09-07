import { differenceInCalendarDays, parseISO } from 'date-fns';

export function getVacationDays(startDate, endDate) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    throw new Error('Vacation dates must be a valid range');
  }
  return differenceInCalendarDays(end, start) + 1;
}

export function canStartVacation(history = [], now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 90);
  return history.filter((item) => new Date(item.startedAt) >= cutoff).length < 2;
}
