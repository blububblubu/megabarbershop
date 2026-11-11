import { NextRequest, NextResponse } from 'next/server';
import {
  cancelBookingAsGuest,
  getPublicBookingByCode,
} from '@/lib/services/booking-service';
import { checkRateLimit } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? 'unknown';
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`check:${ip}`, 30, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan. Silakan tunggu sebentar.' },
        { status: 429 }
      );
    }

    const code = new URL(request.url).searchParams.get('code') ?? '';
    if (!code.trim()) {
      return NextResponse.json(
        { error: 'Kode booking wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await getPublicBookingByCode(code);
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({ booking: result.data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memeriksa status booking.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`cancel:${ip}`, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan pembatalan. Coba lagi nanti.' },
        { status: 429 }
      );
    }

    const body = (await request.json()) as {
      code?: string;
      phoneLast4?: string;
      note?: string;
    };

    if (!body.code || !body.phoneLast4) {
      return NextResponse.json(
        { error: 'Kode booking dan 4 digit terakhir nomor WhatsApp wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await cancelBookingAsGuest(
      body.code,
      body.phoneLast4,
      body.note
    );

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({ booking: result.data }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal membatalkan booking.' },
      { status: 500 }
    );
  }
}

