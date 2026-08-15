import { format, addMinutes, isBefore, isAfter } from 'date-fns';
import { Appointment, Barber, BusinessHour, BlockedDate, BarbershopSettings, TimeSlot, Service } from '../types';

const SHOP_TIMEZONE = 'Europe/Zurich';

/**
 * Returns a Date object whose year/month/day/hour/minute/second match the
 * shop's current wall-clock time in Geneva — regardless of the visitor's
 * own device timezone. This mirrors combineDateAndTime()'s "naive local"
 * approach below, so the two remain directly comparable without needing
 * any timezone-offset math at the comparison sites.
 */
export function getShopNow(): Date {
  const now = new Date();
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = dtf.formatToParts(now).reduce((acc: any, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour === '24' ? 0 : Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
}

/**
 * Converts a date string (YYYY-MM-DD) and a time string (HH:mm or HH:mm:ss) into a clean JS Date object.
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const cleanTime = timeStr.slice(0, 5); // "09:30"
  const isoString = `${dateStr}T${cleanTime}:00`;
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    // Fallback if parsing fails
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = cleanTime.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0);
  }
  return date;
}

/**
 * Checks if two time intervals overlap according to rule:
 * new_start < existing_end AND new_end > existing_start
 */
export function doIntervalsOverlap(
  newStart: Date,
  newEnd: Date,
  existingStart: Date,
  existingEnd: Date
): boolean {
  return isBefore(newStart, existingEnd) && isAfter(newEnd, existingStart);
}

/**
 * Generates available time slots for a given target date, selected service duration,
 * business hours, settings, blocked dates, and existing appointments.
 *
 * IMPORTANT: `reason` is a translation CODE ('requiresNotice' | 'reserved' | 'noBarbers'),
 * NOT display text. This file has no React context, so it cannot safely react to language
 * changes on its own — translation happens in BookingFlow.tsx via t(`booking.step2.reasons.${slot.reason}`),
 * which correctly re-renders whenever the language changes.
 */
export function generateAvailableSlots(params: {
  selectedDateStr: string; // "YYYY-MM-DD"
  serviceDurationMinutes: number;
  businessHours: BusinessHour[];
  settings: BarbershopSettings;
  blockedDates: BlockedDate[];
  existingAppointments: Appointment[];
  selectedBarberId?: string | null;
  barbers?: Barber[];
}): TimeSlot[] {
  const {
    selectedDateStr,
    serviceDurationMinutes,
    businessHours,
    settings,
    blockedDates,
    existingAppointments,
    selectedBarberId,
    barbers = [],
  } = params;

  // 1. Check if the date is blocked
  const isDateBlocked = blockedDates.some((b) => b.blocked_date === selectedDateStr);
  if (isDateBlocked) {
    return [];
  }

  // 2. Get weekday for selectedDateStr (0 = Sun, 1 = Mon ... 6 = Sat)
  const [year, month, day] = selectedDateStr.split('-').map(Number);
  const targetDateObj = new Date(year, month - 1, day);
  const weekday = targetDateObj.getDay();

  // 3. Find business hours for this weekday
  const daySchedule = businessHours.find((bh) => bh.weekday === weekday);
  if (!daySchedule || !daySchedule.is_open) {
    return [];
  }

  // 4. Parse business hours start and end
  const workStart = combineDateAndTime(selectedDateStr, daySchedule.start_time);
  const workEnd = combineDateAndTime(selectedDateStr, daySchedule.end_time);

  if (isNaN(workStart.getTime()) || isNaN(workEnd.getTime())) {
    return [];
  }

  // 5. Booking notice safety check — anchored to Geneva time, not the visitor's device
  const now = getShopNow();
  const noticeCutoff = addMinutes(now, settings.booking_notice_hours * 60);

  // 6. Filter active existing appointments for this date (excluding cancelled)
  const activeAppointments = existingAppointments.filter((app) => {
    return (
      app.appointment_date === selectedDateStr &&
      app.status !== 'cancelled'
    );
  });

  const relevantAppointments = selectedBarberId
    ? activeAppointments.filter((app) => app.barber_id === selectedBarberId)
    : activeAppointments;

  const barberIdsToCheck = selectedBarberId
    ? [selectedBarberId]
    : barbers.filter((barber) => barber.is_active).map((barber) => barber.id);

  // Convert active appointments into Date interval objects
  const existingIntervals = relevantAppointments.map((app) => ({
    start: combineDateAndTime(selectedDateStr, app.start_time),
    end: combineDateAndTime(selectedDateStr, app.end_time),
  }));

  // 7. Loop through candidates with step = slot_interval_minutes
  const intervalMinutes = settings.slot_interval_minutes || 30;
  const slots: TimeSlot[] = [];

  let currentPointer = new Date(workStart.getTime());

  while (true) {
    // The candidate slot start & end
    const candidateStart = new Date(currentPointer.getTime());
    const candidateEnd = addMinutes(candidateStart, serviceDurationMinutes);

    // If candidate end time exceeds working hours end time, stop generating
    if (isAfter(candidateEnd, workEnd)) {
      break;
    }

    let isAvailable = true;
    // reasonCode is a translation key, NOT display text — BookingFlow.tsx translates it live
    let reasonCode: '' | 'requiresNotice' | 'reserved' | 'noBarbers' = '';
    let matchedBarberId: string | null = null;

    // Check if slot start is before notice cutoff time (if selected date is today)
    if (isBefore(candidateStart, noticeCutoff)) {
      isAvailable = false;
      reasonCode = 'requiresNotice';
    }

    if (isAvailable) {
      if (selectedBarberId) {
        const hasConflict = existingIntervals.some((existing) =>
          doIntervalsOverlap(candidateStart, candidateEnd, existing.start, existing.end)
        );

        isAvailable = !hasConflict;
        reasonCode = hasConflict ? 'reserved' : '';
        matchedBarberId = selectedBarberId;
      } else {
        const availableBarberIds = barberIdsToCheck.filter((barberId) => {
          const barberAppointments = activeAppointments.filter((app) => app.barber_id === barberId);
          return !barberAppointments.some((app) => {
            const start = combineDateAndTime(selectedDateStr, app.start_time);
            const end = combineDateAndTime(selectedDateStr, app.end_time);
            return doIntervalsOverlap(candidateStart, candidateEnd, start, end);
          });
        });

        if (availableBarberIds.length === 0) {
          isAvailable = false;
          reasonCode = 'noBarbers';
        } else {
          matchedBarberId = availableBarberIds[0];
        }
      }
    }

    const startTimeStr = format(candidateStart, 'HH:mm');
    const endTimeStr = format(candidateEnd, 'HH:mm');
    const label = `${format(candidateStart, 'hh:mm a')} - ${format(candidateEnd, 'hh:mm a')}`;

    slots.push({
      start: candidateStart,
      end: candidateEnd,
      startTimeString: startTimeStr,
      endTimeString: endTimeStr,
      label,
      isAvailable,
      reason: reasonCode,
      matchedBarberId,
    } as TimeSlot);

    // Advance pointer
    currentPointer = addMinutes(currentPointer, intervalMinutes);
  }

  return slots;
}

/**
 * Returns how many bookable slots remain today for a given service,
 * by reusing generateAvailableSlots() against today's date (Geneva time).
 * Used for the "X slots available today" badge on service cards.
 */
export function getSlotsRemainingToday(params: {
  service: Service;
  businessHours: BusinessHour[];
  settings: BarbershopSettings;
  blockedDates: BlockedDate[];
  existingAppointments: Appointment[];
  barbers?: Barber[];
}): number {
  const { service, businessHours, settings, blockedDates, existingAppointments, barbers = [] } = params;

  const todayStr = format(getShopNow(), 'yyyy-MM-dd');

  const slots = generateAvailableSlots({
    selectedDateStr: todayStr,
    serviceDurationMinutes: service.duration_minutes,
    businessHours,
    settings,
    blockedDates,
    existingAppointments,
    barbers,
  });

  return slots.filter((slot) => slot.isAvailable).length;
}