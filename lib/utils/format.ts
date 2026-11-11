import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Normalisasi nomor telepon Indonesia menjadi format digit `628...`
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  if (digits.startsWith('8')) {
    return '62' + digits;
  }
  return digits;
}

export function isValidIndonesianPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  return /^628\d{7,12}$/.test(normalized);
}

export function buildWhatsappUrl(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) return '#';
  const base = `https://wa.me/${normalized}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function buildGoogleMapsDirectionsUrl(
  mapsLink: string,
  address: string
): string {
  const pinMatch = mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (pinMatch) {
    return `https://www.google.com/maps/dir/?api=1&destination=${pinMatch[1]},${pinMatch[2]}`;
  }
  const atMatch = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return `https://www.google.com/maps/dir/?api=1&destination=${atMatch[1]},${atMatch[2]}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    address
  )}`;
}

export function getWibNowParts(now: Date = new Date()): {
  dateStr: string;
  timeStr: string;
  minutesOfDay: number;
} {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';

  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));

  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    minutesOfDay: hour * 60 + minute,
  };
}

/**
 * Konversi YYYY-MM-DD ke day_of_week versi PRD (0 = Senin .. 6 = Minggu)
 */
export function getDayOfWeekMonZero(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const utcDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (utcDay + 6) % 7;
}

export function addDaysToDateStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function formatIndonesianDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
}

export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const DAY_NAMES_ID = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
] as const;

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

