import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';
import { updateBookingStatusAsAdmin } from '@/lib/services/booking-service';
import type { BookingStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [bookingRes, logsRes] = await Promise.all([
    auth.supabase
      .from('bookings')
      .select(
        `
        *,
        service:services ( id, name, duration_minutes ),
        barber:barbers ( id, name, photo_url )
      `
      )
      .eq('id', params.id)
      .maybeSingle(),
    auth.supabase
      .from('booking_status_logs')
      .select('*')
      .eq('booking_id', params.id)
      .order('created_at', { ascending: false }),
  ]);

  if (bookingRes.error || !bookingRes.data) {
    return NextResponse.json({ error: 'Booking tidak ditemukan.' }, { status: 404 });
  }

  return NextResponse.json({
    booking: bookingRes.data,
    logs: logsRes.data ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    status?: BookingStatus;
    note?: string;
  };

  if (!body.status || !['confirmed', 'done', 'cancelled'].includes(body.status)) {
    return NextResponse.json(
      { error: 'Status tujuan harus confirmed, done, atau cancelled.' },
      { status: 400 }
    );
  }

  const result = await updateBookingStatusAsAdmin(
    params.id,
    body.status,
    auth.user.id,
    body.note
  );

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.statusCode }
    );
  }

  return NextResponse.json({ booking: result.data });
}

