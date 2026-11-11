import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRpc, mockFrom, mockRequireAdminUser } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
  mockRequireAdminUser: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  isServiceRoleConfigured: () => true,
  createAdminClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
  requireAdminUser: mockRequireAdminUser,
}));

import { POST as postBooking } from '@/app/api/booking/route';
import {
  GET as getCheckBooking,
  PATCH as patchCheckBooking,
} from '@/app/api/check-booking/route';
import { GET as getAdminServices } from '@/app/api/admin/services/route';
import { GET as getAdminBookings } from '@/app/api/admin/bookings/route';
import { PUT as putAdminSettings } from '@/app/api/admin/settings/route';

describe('Admin API Authorization (AC-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminUser.mockResolvedValue(null);
  });

  it('menolak akses tanpa login dengan status 401 pada route admin', async () => {
    const resServices = await getAdminServices();
    expect(resServices.status).toBe(401);

    const resBookings = await getAdminBookings(
      new NextRequest('http://localhost:3000/api/admin/bookings')
    );
    expect(resBookings.status).toBe(401);

    const resSettings = await putAdminSettings(
      new NextRequest('http://localhost:3000/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ items: [] }),
      })
    );
    expect(resSettings.status).toBe(401);
  });
});

describe('Booking Concurrency & Check Booking (AC-02, AC-03, AC-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('menangani 2 request booking paralel pada slot sama: satu 201, satu 409', async () => {
    let callCount = 0;
    mockRpc.mockImplementation(async (fnName: string) => {
      if (fnName !== 'create_booking_atomic') {
        return { data: null, error: { message: 'UNKNOWN_RPC' } };
      }
      callCount += 1;
      if (callCount === 1) {
        return {
          data: {
            id: 'bk-1',
            booking_code: 'STR-20261110-ABCD',
            status: 'pending',
            price_snapshot: 30000,
          },
          error: null,
        };
      }
      return {
        data: null,
        error: { message: 'SLOT_UNAVAILABLE' },
      };
    });

    const payload = {
      serviceId: 'srv-1',
      barberId: 'brb-1',
      bookingDate: '2026-11-12',
      startTime: '11:00',
      guestName: 'Andi Wijaya',
      guestPhone: '081234567890',
    };

    const req1 = new NextRequest('http://localhost:3000/api/booking', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1' },
      body: JSON.stringify(payload),
    });
    const req2 = new NextRequest('http://localhost:3000/api/booking', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.2' },
      body: JSON.stringify({ ...payload, guestName: 'Budi Pratama' }),
    });

    const [res1, res2] = await Promise.all([postBooking(req1), postBooking(req2)]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([201, 409]);

    const body2 = await res2.json();
    expect(body2.error).toContain('Slot tidak tersedia');
  });

  it('menyamarkan nomor HP saat cek booking dan menolak kode invalid', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: 'bk-1',
              booking_code: 'STR-20261110-ABCD',
              guest_name: 'Andi',
              guest_phone: '6281234567890',
              booking_date: '2026-11-12',
              start_time: '11:00:00',
              end_time: '11:40:00',
              price_snapshot: 30000,
              status: 'pending',
            },
            error: null,
          }),
        }),
      }),
    });

    const validRes = await getCheckBooking(
      new NextRequest(
        'http://localhost:3000/api/check-booking?code=STR-20261110-ABCD'
      )
    );
    expect(validRes.status).toBe(200);
    const validData = await validRes.json();
    expect(validData.booking.guest_phone).toBe('6281****7890');

    const invalidRes = await getCheckBooking(
      new NextRequest('http://localhost:3000/api/check-booking?code=INVALID')
    );
    expect(invalidRes.status).toBe(404);
  });

  it('menolak pembatalan guest jika 4 digit terakhir WA salah', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'PHONE_VERIFICATION_FAILED' },
    });

    const res = await patchCheckBooking(
      new NextRequest('http://localhost:3000/api/check-booking', {
        method: 'PATCH',
        headers: { 'x-forwarded-for': '10.0.0.9' },
        body: JSON.stringify({
          code: 'STR-20261110-ABCD',
          phoneLast4: '0000',
        }),
      })
    );

    expect(res.status).toBe(403);
  });
});

