const STORAGE_KEY = 'setara_recent_booking_codes';
const MAX_ITEMS = 5;

export function getRecentBookingCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === 'string').slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}

export function saveRecentBookingCode(code: string): void {
  if (typeof window === 'undefined' || !code) return;
  try {
    const clean = code.trim().toUpperCase();
    const existing = getRecentBookingCodes().filter((c) => c !== clean);
    const updated = [clean, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Abaikan jika storage diblokir browser
  }
}

