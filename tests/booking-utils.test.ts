import { describe, expect, it } from 'vitest';
import {
  buildWhatsappUrl,
  isValidIndonesianPhone,
  normalizePhone,
} from '@/lib/utils/format';
import { mapRpcError } from '@/lib/services/booking-service';
import { checkRateLimit } from '@/lib/utils/rate-limit';

describe('Phone formatting & WhatsApp helpers', () => {
  it('menormalisasi format 08... dan +62... ke 628...', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('6281234567890');
    expect(normalizePhone('+62 812 3456 7890')).toBe('6281234567890');
    expect(isValidIndonesianPhone('081234567890')).toBe(true);
    expect(isValidIndonesianPhone('123')).toBe(false);
  });

  it('membuat URL wa.me yang valid', () => {
    const url = buildWhatsappUrl('081234567890', 'Halo Admin');
    expect(url).toBe('https://wa.me/6281234567890?text=Halo%20Admin');
  });
});

describe('RPC error mapping & concurrency status codes', () => {
  it('memetakan SLOT_UNAVAILABLE ke 409', () => {
    const mapped = mapRpcError('SLOT_UNAVAILABLE');
    expect(mapped.status).toBe(409);
    expect(mapped.message).toContain('Slot tidak tersedia');
  });

  it('memetakan PHONE_VERIFICATION_FAILED ke 403', () => {
    const mapped = mapRpcError('PHONE_VERIFICATION_FAILED');
    expect(mapped.status).toBe(403);
  });
});

describe('Rate limiter (NFR-01)', () => {
  it('membatasi maksimal 10 request dalam 1 window', () => {
    const key = `test-ip-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(key, 10, 60_000).allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 10, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });
});

