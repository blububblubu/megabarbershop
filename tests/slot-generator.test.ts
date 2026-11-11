import { describe, expect, it } from 'vitest';
import { generateAvailableSlots } from '@/lib/services/slot-generator';

describe('generateAvailableSlots (SETARA Barbershop schedule)', () => {
  // Referensi waktu: Selasa 2026-11-10 pukul 09:00 WIB (02:00 UTC)
  const tuesdayMorningNow = new Date('2026-11-10T02:00:00Z');

  it('menghasilkan 15 slot (11:00 s/d 20:20) untuk hari Selasa 11:00–21:00', () => {
    const slots = generateAvailableSlots({
      dateStr: '2026-11-10',
      slotDurationMinutes: 40,
      minLeadMinutes: 30,
      maxDaysAhead: 14,
      closedDays: [0],
      storeHours: { open: '11:00', close: '21:00' },
      barberSchedule: {
        is_working: true,
        start_time: '11:00:00',
        end_time: '21:00:00',
        break_start: null,
        break_end: null,
      },
      occupiedStartTimes: [],
      now: tuesdayMorningNow,
    });

    expect(slots).toHaveLength(15);
    expect(slots[0]).toEqual({
      startTime: '11:00',
      endTime: '11:40',
      available: true,
    });
    expect(slots[slots.length - 1]).toEqual({
      startTime: '20:20',
      endTime: '21:00',
      available: true,
    });
  });

  it('menghasilkan 12 slot (13:00 s/d 20:20) untuk hari Jumat 13:00–21:00', () => {
    // 2026-11-13 adalah Jumat
    const slots = generateAvailableSlots({
      dateStr: '2026-11-13',
      slotDurationMinutes: 40,
      minLeadMinutes: 30,
      maxDaysAhead: 14,
      closedDays: [0],
      storeHours: { open: '13:00', close: '21:00' },
      barberSchedule: {
        is_working: true,
        start_time: '13:00:00',
        end_time: '21:00:00',
        break_start: null,
        break_end: null,
      },
      occupiedStartTimes: [],
      now: tuesdayMorningNow,
    });

    expect(slots).toHaveLength(12);
    expect(slots[0].startTime).toBe('13:00');
    expect(slots[slots.length - 1].startTime).toBe('20:20');
  });

  it('mengembalikan array kosong pada hari Senin (tutup)', () => {
    // 2026-11-16 adalah Senin
    const slots = generateAvailableSlots({
      dateStr: '2026-11-16',
      slotDurationMinutes: 40,
      minLeadMinutes: 30,
      maxDaysAhead: 14,
      closedDays: [0],
      storeHours: null,
      barberSchedule: {
        is_working: false,
        start_time: '11:00:00',
        end_time: '21:00:00',
        break_start: null,
        break_end: null,
      },
      occupiedStartTimes: [],
      now: tuesdayMorningNow,
    });

    expect(slots).toEqual([]);
  });

  it('menyaring slot yang sudah dibooking & jam istirahat', () => {
    const slots = generateAvailableSlots({
      dateStr: '2026-11-11',
      slotDurationMinutes: 40,
      minLeadMinutes: 30,
      maxDaysAhead: 14,
      closedDays: [0],
      storeHours: { open: '11:00', close: '21:00' },
      barberSchedule: {
        is_working: true,
        start_time: '11:00:00',
        end_time: '21:00:00',
        break_start: '12:00:00',
        break_end: '13:00:00',
      },
      occupiedStartTimes: ['11:00:00', '15:00'],
      now: tuesdayMorningNow,
    });

    const slot1100 = slots.find((s) => s.startTime === '11:00');
    const slot1500 = slots.find((s) => s.startTime === '15:00');
    const slot1300 = slots.find((s) => s.startTime === '13:00');

    expect(slot1100).toEqual({
      startTime: '11:00',
      endTime: '11:40',
      available: false,
    });
    expect(slot1500).toEqual({
      startTime: '15:00',
      endTime: '15:40',
      available: false,
    });
    expect(slot1300?.available).toBe(true);

    const startTimes = slots.map((s) => s.startTime);
    // 11:40 (11:40-12:20) & 12:20 (12:20-13:00) menabrak istirahat 12:00-13:00
    expect(startTimes).not.toContain('11:40');
    expect(startTimes).not.toContain('12:20');
  });

  it('menyaring slot yang sudah lewat atau kurang dari lead time 30 menit hari ini (WIB)', () => {
    // 2026-11-10 pukul 11:20 WIB (04:20 UTC) -> +30m = 11:50 -> 11:00 & 11:40 tidak muncul
    const now1120Wib = new Date('2026-11-10T04:20:00Z');
    const slots = generateAvailableSlots({
      dateStr: '2026-11-10',
      slotDurationMinutes: 40,
      minLeadMinutes: 30,
      maxDaysAhead: 14,
      closedDays: [0],
      storeHours: { open: '11:00', close: '21:00' },
      barberSchedule: {
        is_working: true,
        start_time: '11:00:00',
        end_time: '21:00:00',
        break_start: null,
        break_end: null,
      },
      occupiedStartTimes: [],
      now: now1120Wib,
    });

    expect(slots[0].startTime).toBe('12:20');
  });

  it('mengembalikan array kosong jika tanggal melebihi H+14', () => {
    const slots = generateAvailableSlots({
      dateStr: '2026-11-25', // H+15 dari 2026-11-10
      slotDurationMinutes: 40,
      minLeadMinutes: 30,
      maxDaysAhead: 14,
      closedDays: [0],
      storeHours: { open: '11:00', close: '21:00' },
      barberSchedule: {
        is_working: true,
        start_time: '11:00:00',
        end_time: '21:00:00',
        break_start: null,
        break_end: null,
      },
      occupiedStartTimes: [],
      now: tuesdayMorningNow,
    });

    expect(slots).toEqual([]);
  });
});

