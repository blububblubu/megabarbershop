import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const status = searchParams.get('status');
  const barberId = searchParams.get('barberId');
  const code = searchParams.get('code');

  let query = auth.supabase
    .from('bookings')
    .select(
      `
      *,
      service:services ( id, name, duration_minutes ),
      barber:barbers ( id, name, photo_url )
    `
    )
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: true });

  if (date) query = query.eq('booking_date', date);
  if (status && status !== 'all') query = query.eq('status', status);
  if (barberId && barberId !== 'all') query = query.eq('barber_id', barberId);
  if (code?.trim()) {
    query = query.ilike('booking_code', `%${code.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookings: data ?? [] });
}

