import { addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

export function getEnrollmentDayLimits(classData, now = new Date()) {
  const min = Number(classData.minPurchaseDays || 1);
  if (classData.durationType === 'ongoing') return { min, max: 30, endingSoon: false };
  const timezone = classData.timezone || 'UTC';
  const today = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
  const end = formatInTimeZone(classData.endDate, timezone, 'yyyy-MM-dd');
  const max = Math.max(0, differenceInCalendarDays(parseISO(end), parseISO(today)) + 1);
  return { min, max, endingSoon: max < min };
}

export function getAccessWindow(classData, numberOfDays, now = new Date()) {
  const timezone = classData.timezone || 'UTC';
  const startDay = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
  const endDay = addDays(parseISO(startDay), numberOfDays - 1);
  return {
    startDate: fromZonedTime(`${startDay}T00:00:00`, timezone),
    endDate: fromZonedTime(`${formatInTimeZone(endDay, timezone, 'yyyy-MM-dd')}T23:59:59`, timezone),
    timezone,
  };
}

export function validateEnrollmentDays(classData, numberOfDays, now = new Date()) {
  const limits = getEnrollmentDayLimits(classData, now);
  if (!Number.isInteger(Number(numberOfDays)) || Number(numberOfDays) < limits.min || Number(numberOfDays) > limits.max) {
    const error = new Error(`Choose between ${limits.min} and ${limits.max} calendar days`);
    error.statusCode = 400;
    throw error;
  }
  if (limits.endingSoon) {
    const error = new Error('This class is ending soon');
    error.statusCode = 400;
    throw error;
  }
  return limits;
}
