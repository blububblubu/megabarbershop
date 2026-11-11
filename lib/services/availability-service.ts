import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { getDayOfWeekMonZero } from '@/lib/utils/format';
import { generateAvailableSlots } from '@/lib/services/slot-generator';
import { parseSettingsRows, DEFAULT_SETTINGS } from '@/lib/services/settings-service';
import type { TimeSlotOption } from '@/types';

export interface AvailabilityResult {
  date: string;
  barberId: string;
  slotDurationMinutes: number;
  isClosed: boolean;
  reason?: string;
  slots: TimeSlotOption[];
}

export async function getBarberAvailability(
  barberId: string,
  dateStr: string
): Promise<AvailabilityResult> {
  if (!isServiceRoleConfigured()) {
    return {
      date: dateStr,
      barberId,
      slotDurationMinutes: DEFAULT_SETTINGS.slotDurationMinutes,
      isClosed: true,
      reason: 'Konfigurasi database belum tersedia.',
      slots: [],
    };
  }

  const admin = createAdminClient();

  const [settingsRes, barberRes, scheduleRes, bookingsRes] = await Promise.all([
    admin.from('settings').select('key, value'),
    admin
      .from('barbers')
      .select('id, is_active')
      .eq('id', barberId)
      .maybeSingle(),
    admin
      .from('barber_schedules')
      .select('is_working, start_time, end_time, break_start, break_end')
      .eq('barber_id', barberId)
      .eq('day_of_week', getDayOfWeekMonZero(dateStr))
      .maybeSingle(),
    admin
      .from('bookings')
      .select('start_time')
      .eq('barber_id', barberId)
      .eq('booking_date', dateStr)
      .in('status', ['pending', 'confirmed']),
  ]);

  const settings = settingsRes.data?.length
    ? parseSettingsRows(settingsRes.data)
    : DEFAULT_SETTINGS;

  if (!barberRes.data || !barberRes.data.is_active) {
    return {
      date: dateStr,
      barberId,
      slotDurationMinutes: settings.slotDurationMinutes,
      isClosed: true,
      reason: 'Barber tidak tersedia.',
      slots: [],
    };
  }

  const dayOfWeek = getDayOfWeekMonZero(dateStr);
  const storeHours = settings.operatingHours[String(dayOfWeek)] ?? null;
  const isStoreClosed = settings.closedDays.includes(dayOfWeek) || !storeHours;

  if (isStoreClosed) {
    return {
      date: dateStr,
      barberId,
      slotDurationMinutes: settings.slotDurationMinutes,
      isClosed: true,
      reason: 'Barbershop tutup pada hari yang dipilih.',
      slots: [],
    };
  }

  if (!scheduleRes.data || !scheduleRes.data.is_working) {
    return {
      date: dateStr,
      barberId,
      slotDurationMinutes: settings.slotDurationMinutes,
      isClosed: true,
      reason: 'Barber sedang libur pada hari yang dipilih.',
      slots: [],
    };
  }

  const occupiedStartTimes = (bookingsRes.data ?? []).map((b) => b.start_time);

  const slots = generateAvailableSlots({
    dateStr,
    slotDurationMinutes: settings.slotDurationMinutes,
    minLeadMinutes: settings.bookingMinLeadMinutes,
    maxDaysAhead: settings.bookingMaxDaysAhead,
    closedDays: settings.closedDays,
    storeHours,
    barberSchedule: scheduleRes.data,
    occupiedStartTimes,
  });

  return {
    date: dateStr,
    barberId,
    slotDurationMinutes: settings.slotDurationMinutes,
    isClosed: false,
    slots,
  };
}

