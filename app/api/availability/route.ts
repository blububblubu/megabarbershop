import { NextRequest, NextResponse } from 'next/server';
import { getBarberAvailability } from '@/lib/services/availability-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId') ?? '';
    const date = searchParams.get('date') ?? '';

    if (!barberId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Parameter barberId dan date (YYYY-MM-DD) wajib diisi.' },
        { status: 400 }
      );
    }

    const result = await getBarberAvailability(barberId, date);
    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Gagal memuat ketersediaan slot.' },
      { status: 500 }
    );
  }
}

