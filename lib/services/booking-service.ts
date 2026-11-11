import { createAdminClient, isServiceRoleConfigured } from '@/lib/supabase/admin';
import { isValidIndonesianPhone, normalizePhone } from '@/lib/utils/format';
import type { Booking, BookingStatus, BookingWithRelations } from '@/types';

export interface CreateBookingPayload {
  serviceId: string;
  barberId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string;   // HH:mm
  guestName: string;
  guestPhone: string;
  notes?: string;
}

const RPC_ERROR_MESSAGES: Record<string, { message: string; status: number }> = {
  SLOT_UNAVAILABLE: {
    message: 'Slot tidak tersedia. Silakan pilih waktu lain.',
    status: 409,
  },
  MAX_PENDING_REACHED: {
    message:
      'Nomor WhatsApp ini sudah memiliki batas maksimal booking PENDING aktif. Selesaikan atau batalkan booking sebelumnya.',
    status: 429,
  },
  STORE_CLOSED: {
    message: 'Barbershop tutup pada tanggal yang dipilih.',
    status: 400,
  },
  BARBER_NOT_WORKING: {
    message: 'Barber tidak bertugas pada hari yang dipilih.',
    status: 400,
  },
  OUTSIDE_OPERATING_HOURS: {
    message: 'Jam yang dipilih berada di luar jam operasional barbershop.',
    status: 400,
  },
  OUTSIDE_BARBER_SCHEDULE: {
    message: 'Jam yang dipilih berada di luar jam kerja barber.',
    status: 400,
  },
  INSIDE_BARBER_BREAK: {
    message: 'Jam yang dipilih bertepatan dengan jam istirahat barber.',
    status: 400,
  },
  DATE_OUT_OF_RANGE: {
    message: 'Tanggal booking di luar rentang yang diizinkan (hari ini s/d H+14).',
    status: 400,
  },
  SLOT_TOO_SOON_OR_PASSED: {
    message: 'Slot sudah lewat atau kurang dari 30 menit sebelum waktu mulai.',
    status: 400,
  },
  SERVICE_NOT_FOUND: {
    message: 'Layanan tidak ditemukan atau sedang nonaktif.',
    status: 404,
  },
  BARBER_NOT_FOUND: {
    message: 'Barber tidak ditemukan atau sedang nonaktif.',
    status: 404,
  },
  INVALID_GUEST_NAME: {
    message: 'Nama lengkap minimal 2 karakter.',
    status: 400,
  },
  INVALID_GUEST_PHONE: {
    message: 'Nomor WhatsApp tidak valid.',
    status: 400,
  },
  BOOKING_NOT_FOUND: {
    message: 'Kode booking tidak ditemukan.',
    status: 404,
  },
  CANNOT_CANCEL_NON_PENDING: {
    message: 'Hanya booking berstatus PENDING yang dapat dibatalkan langsung. Hubungi admin via WhatsApp.',
    status: 400,
  },
  PHONE_VERIFICATION_FAILED: {
    message: '4 digit terakhir nomor WhatsApp tidak cocok.',
    status: 403,
  },
  INVALID_STATUS_TRANSITION: {
    message: 'Perubahan status booking tidak valid.',
    status: 400,
  },
  CANCEL_NOTE_REQUIRED: {
    message: 'Alasan pembatalan wajib diisi.',
    status: 400,
  },
};

export function mapRpcError(errorMessage?: string): { message: string; status: number } {
  if (!errorMessage) {
    return { message: 'Terjadi kesalahan pada sistem.', status: 500 };
  }
  for (const [code, info] of Object.entries(RPC_ERROR_MESSAGES)) {
    if (errorMessage.includes(code)) {
      return info;
    }
  }
  return { message: 'Gagal memproses permintaan booking.', status: 500 };
}

export async function createBooking(payload: CreateBookingPayload): Promise<{
  data?: Booking;
  error?: string;
  statusCode: number;
}> {
  const cleanName = payload.guestName.trim();
  if (cleanName.length < 2 || cleanName.length > 100) {
    return { error: 'Nama lengkap harus 2–100 karakter.', statusCode: 400 };
  }

  if (!isValidIndonesianPhone(payload.guestPhone)) {
    return {
      error: 'Format nomor WhatsApp tidak valid (contoh: 081234567890).',
      statusCode: 400,
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.bookingDate)) {
    return { error: 'Format tanggal booking tidak valid.', statusCode: 400 };
  }

  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(payload.startTime)) {
    return { error: 'Format jam slot tidak valid.', statusCode: 400 };
  }

  const normalizedPhone = normalizePhone(payload.guestPhone);
  const startTimeSql =
    payload.startTime.length === 5 ? `${payload.startTime}:00` : payload.startTime;

  if (!isServiceRoleConfigured()) {
    return {
      error: 'Konfigurasi database belum tersedia.',
      statusCode: 503,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('create_booking_atomic', {
    p_service_id: payload.serviceId,
    p_barber_id: payload.barberId,
    p_booking_date: payload.bookingDate,
    p_start_time: startTimeSql,
    p_guest_name: cleanName,
    p_guest_phone: normalizedPhone,
    p_notes: payload.notes?.trim() ? payload.notes.trim().slice(0, 500) : null,
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    return { error: mapped.message, statusCode: mapped.status };
  }

  return { data: data as Booking, statusCode: 201 };
}

export async function getPublicBookingByCode(code: string): Promise<{
  data?: BookingWithRelations;
  error?: string;
  statusCode: number;
}> {
  const cleanCode = code.trim().toUpperCase();
  if (!/^STR-\d{8}-[A-Z0-9]{4}$/.test(cleanCode)) {
    return {
      error: 'Kode booking tidak ditemukan atau format tidak valid.',
      statusCode: 404,
    };
  }

  if (!isServiceRoleConfigured()) {
    return {
      error: 'Konfigurasi database belum tersedia.',
      statusCode: 503,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('bookings')
    .select(
      `
      id,
      booking_code,
      service_id,
      barber_id,
      guest_name,
      guest_phone,
      booking_date,
      start_time,
      end_time,
      price_snapshot,
      status,
      notes,
      created_at,
      updated_at,
      service:services ( id, name, duration_minutes ),
      barber:barbers ( id, name, photo_url )
    `
    )
    .eq('booking_code', cleanCode)
    .maybeSingle();

  if (error || !data) {
    return {
      error: 'Kode booking tidak ditemukan.',
      statusCode: 404,
    };
  }

  // Mask nomor HP pada respon publik agar privasi lebih terjaga
  const phone = String(data.guest_phone ?? '');
  const maskedPhone =
    phone.length > 4
      ? `${phone.slice(0, 4)}****${phone.slice(-4)}`
      : '****';

  return {
    data: {
      ...(data as unknown as BookingWithRelations),
      guest_phone: maskedPhone,
    },
    statusCode: 200,
  };
}

export async function cancelBookingAsGuest(
  code: string,
  phoneLast4: string,
  note?: string
): Promise<{ data?: Booking; error?: string; statusCode: number }> {
  if (!isServiceRoleConfigured()) {
    return {
      error: 'Konfigurasi database belum tersedia.',
      statusCode: 503,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('cancel_booking_by_guest', {
    p_booking_code: code.trim().toUpperCase(),
    p_phone_last4: phoneLast4.trim(),
    p_note: note?.trim() || 'Dibatalkan oleh pelanggan',
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    return { error: mapped.message, statusCode: mapped.status };
  }

  return { data: data as Booking, statusCode: 200 };
}

export async function updateBookingStatusAsAdmin(
  bookingId: string,
  newStatus: BookingStatus,
  adminId: string,
  note?: string
): Promise<{ data?: Booking; error?: string; statusCode: number }> {
  if (!isServiceRoleConfigured()) {
    return {
      error: 'Konfigurasi database belum tersedia.',
      statusCode: 503,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('update_booking_status_admin', {
    p_booking_id: bookingId,
    p_new_status: newStatus,
    p_admin_id: adminId,
    p_note: note?.trim() || null,
  });

  if (error) {
    const mapped = mapRpcError(error.message);
    return { error: mapped.message, statusCode: mapped.status };
  }

  return { data: data as Booking, statusCode: 200 };
}
