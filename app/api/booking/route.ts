import { NextRequest, NextResponse } from 'next/server';
import { createBooking } from '@/lib/services/booking-service';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`booking:${ip}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan booking. Coba lagi dalam ${rate.retryAfterSeconds} detik.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rate.retryAfterSeconds) },
        }
      );
    }

    const body = (await request.json()) as {
      serviceId?: string;
      barberId?: string;
      bookingDate?: string;
      startTime?: string;
      guestName?: string;
      guestPhone?: string;
      notes?: string;
    };

    if (
      !body.serviceId ||
      !body.barberId ||
      !body.bookingDate ||
      !body.startTime ||
      !body.guestName ||
      !body.guestPhone
    ) {
      return NextResponse.json(
        { error: 'Data booking belum lengkap.' },
        { status: 400 }
      );
    }

    const result = await createBooking({
      serviceId: body.serviceId,
      barberId: body.barberId,
      bookingDate: body.bookingDate,
      startTime: body.startTime,
      guestName: body.guestName,
      guestPhone: body.guestPhone,
      notes: body.notes,
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({ booking: result.data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memproses booking.' },
      { status: 500 }
    );
  }
}

