import type { OperatingHoursMap, SettingItem } from '@/types';

export interface ParsedBusinessSettings {
  businessName: string;
  tagline: string;
  logoUrl: string;
  aboutDescription: string;
  address: string;
  whatsappNumber: string;
  googleMapsEmbedUrl: string;
  googleMapsLink: string;
  slotDurationMinutes: number;
  timezone: string;
  bookingMinLeadMinutes: number;
  bookingMaxDaysAhead: number;
  maxPendingPerPhone: number;
  closedDays: number[];
  operatingHours: OperatingHoursMap;
}

export const DEFAULT_OPERATING_HOURS: OperatingHoursMap = {
  '0': null,
  '1': { open: '11:00', close: '21:00' },
  '2': { open: '11:00', close: '21:00' },
  '3': { open: '11:00', close: '21:00' },
  '4': { open: '13:00', close: '21:00' },
  '5': { open: '11:00', close: '21:00' },
  '6': { open: '11:00', close: '21:00' },
};

export const DEFAULT_SETTINGS: ParsedBusinessSettings = {
  businessName: 'SETARA Barbershop',
  tagline: 'Potongan Rapi, Gaya Tetap Setara',
  logoUrl: '',
  aboutDescription:
    'SETARA Barbershop adalah barbershop modern dengan sistem pemesanan slot waktu yang teratur, sehingga Anda tidak perlu mengantre lama.',
  address: '[Alamat Lengkap SETARA Barbershop — ubah via Dashboard Admin]',
  whatsappNumber: '6287857697702',
  googleMapsEmbedUrl:
    'https://maps.google.com/maps?q=-8.165707,113.4496112+(SETARA+BARBERSHOP)&t=&z=17&ie=UTF8&iwloc=B&output=embed',
  googleMapsLink:
    'https://www.google.com/maps/place/SETARA+BARBERSHOP/@-8.165707,113.4447403,17z/data=!3m1!4b1!4m6!3m5!1s0x2dd68b6a0c719fd3:0x16181276698cffdc!8m2!3d-8.165707!4d113.4496112!16s%2Fg%2F11ypw93cb0!5m1!1e4?entry=ttu',
  slotDurationMinutes: 40,
  timezone: 'Asia/Jakarta',
  bookingMinLeadMinutes: 30,
  bookingMaxDaysAhead: 14,
  maxPendingPerPhone: 2,
  closedDays: [0],
  operatingHours: DEFAULT_OPERATING_HOURS,
};

export function parseSettingsRows(
  rows: Pick<SettingItem, 'key' | 'value'>[]
): ParsedBusinessSettings {
  const map = new Map(rows.map((r) => [r.key, r.value]));

  const safeJson = <T>(raw: string | undefined, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const safeInt = (raw: string | undefined, fallback: number): number => {
    if (!raw) return fallback;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  return {
    businessName: map.get('business_name') ?? DEFAULT_SETTINGS.businessName,
    tagline: map.get('tagline') ?? DEFAULT_SETTINGS.tagline,
    logoUrl: map.get('logo_url') ?? DEFAULT_SETTINGS.logoUrl,
    aboutDescription:
      map.get('about_description') ?? DEFAULT_SETTINGS.aboutDescription,
    address: map.get('address') ?? DEFAULT_SETTINGS.address,
    whatsappNumber: map.get('whatsapp_number') ?? DEFAULT_SETTINGS.whatsappNumber,
    googleMapsEmbedUrl:
      map.get('google_maps_embed_url') ?? DEFAULT_SETTINGS.googleMapsEmbedUrl,
    googleMapsLink:
      map.get('google_maps_link') ?? DEFAULT_SETTINGS.googleMapsLink,
    slotDurationMinutes: safeInt(
      map.get('slot_duration_minutes'),
      DEFAULT_SETTINGS.slotDurationMinutes
    ),
    timezone: map.get('timezone') ?? DEFAULT_SETTINGS.timezone,
    bookingMinLeadMinutes: safeInt(
      map.get('booking_min_lead_minutes'),
      DEFAULT_SETTINGS.bookingMinLeadMinutes
    ),
    bookingMaxDaysAhead: safeInt(
      map.get('booking_max_days_ahead'),
      DEFAULT_SETTINGS.bookingMaxDaysAhead
    ),
    maxPendingPerPhone: safeInt(
      map.get('max_pending_per_phone'),
      DEFAULT_SETTINGS.maxPendingPerPhone
    ),
    closedDays: safeJson<number[]>(
      map.get('closed_days'),
      DEFAULT_SETTINGS.closedDays
    ),
    operatingHours: safeJson<OperatingHoursMap>(
      map.get('operating_hours'),
      DEFAULT_SETTINGS.operatingHours
    ),
  };
}

