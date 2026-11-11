import type {
  BarberSchedule,
  DayOperatingHours,
  TimeSlotOption,
} from '@/types';
import {
  addDaysToDateStr,
  getDayOfWeekMonZero,
  getWibNowParts,
  minutesToTime,
  timeToMinutes,
} from '@/lib/utils/format';

export interface SlotGenerationInput {
  dateStr: string;
  slotDurationMinutes: number;
  minLeadMinutes: number;
  maxDaysAhead: number;
  closedDays: number[];
  storeHours: DayOperatingHours | null;
  barberSchedule: Pick<
    BarberSchedule,
    'is_working' | 'start_time' | 'end_time' | 'break_start' | 'break_end'
  > | null;
  occupiedStartTimes: string[]; // HH:mm or HH:mm:ss
  now?: Date;
}

/**
 * Generator slot deterministik sesuai PRD (BR-03, BR-06, BR-13, BR-14).
 * Hanya mengembalikan slot yang:
 * - Di dalam rentang today..H+maxDaysAhead (WIB)
 * - Bukan hari tutup global & barber bekerja hari tersebut
 * - Berada di irisan jam operasional toko dan jadwal barber
 * - Selesai tepat/sebelum jam tutup (end_time <= effectiveClose)
 * - Tidak menabrak jam istirahat (jika diatur)
 * - Belum terlewati dan >= minLeadMinutes dari waktu saat ini
 * - Tidak termasuk slot yang sudah dibooking (pending/confirmed)
 */
export function generateAvailableSlots(input: SlotGenerationInput): TimeSlotOption[] {
  const {
    dateStr,
    slotDurationMinutes,
    minLeadMinutes,
    maxDaysAhead,
    closedDays,
    storeHours,
    barberSchedule,
    occupiedStartTimes,
    now = new Date(),
  } = input;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return [];
  }

  const wibNow = getWibNowParts(now);
  const maxDateStr = addDaysToDateStr(wibNow.dateStr, maxDaysAhead);

  if (dateStr < wibNow.dateStr || dateStr > maxDateStr) {
    return [];
  }

  const dayOfWeek = getDayOfWeekMonZero(dateStr);
  if (closedDays.includes(dayOfWeek) || !storeHours) {
    return [];
  }

  if (!barberSchedule || !barberSchedule.is_working) {
    return [];
  }

  const storeOpenMin = timeToMinutes(storeHours.open);
  const storeCloseMin = timeToMinutes(storeHours.close);
  const barberOpenMin = timeToMinutes(barberSchedule.start_time);
  const barberCloseMin = timeToMinutes(barberSchedule.end_time);

  const effectiveOpen = Math.max(storeOpenMin, barberOpenMin);
  const effectiveClose = Math.min(storeCloseMin, barberCloseMin);

  if (effectiveClose - effectiveOpen < slotDurationMinutes) {
    return [];
  }

  const breakStartMin = barberSchedule.break_start
    ? timeToMinutes(barberSchedule.break_start)
    : null;
  const breakEndMin = barberSchedule.break_end
    ? timeToMinutes(barberSchedule.break_end)
    : null;

  const occupiedSet = new Set(
    occupiedStartTimes.map((t) => t.slice(0, 5))
  );

  const isToday = dateStr === wibNow.dateStr;
  const earliestAllowedMin = wibNow.minutesOfDay + minLeadMinutes;

  const slots: TimeSlotOption[] = [];

  for (
    let startMin = effectiveOpen;
    startMin + slotDurationMinutes <= effectiveClose;
    startMin += slotDurationMinutes
  ) {
    const endMin = startMin + slotDurationMinutes;

    // Cek jam istirahat (jika ada)
    if (
      breakStartMin !== null &&
      breakEndMin !== null &&
      startMin < breakEndMin &&
      endMin > breakStartMin
    ) {
      continue;
    }

    // Cek waktu lewat & lead time minimum untuk hari ini
    if (isToday && startMin < earliestAllowedMin) {
      continue;
    }

    const startTime = minutesToTime(startMin);
    const endTime = minutesToTime(endMin);

    slots.push({
      startTime,
      endTime,
      available: !occupiedSet.has(startTime),
    });
  }

  return slots;
}

