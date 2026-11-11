import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const barberId = new URL(request.url).searchParams.get('barberId');
  let query = auth.supabase
    .from('barber_schedules')
    .select('*')
    .order('day_of_week', { ascending: true });

  if (barberId) {
    query = query.eq('barber_id', barberId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedules: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    barberId?: string;
    schedules?: Array<{
      day_of_week: number;
      start_time: string;
      end_time: string;
      break_start: string | null;
      break_end: string | null;
      is_working: boolean;
    }>;
  };

  if (!body.barberId || !Array.isArray(body.schedules) || body.schedules.length === 0) {
    return NextResponse.json(
      { error: 'barberId dan array schedules wajib diisi.' },
      { status: 400 }
    );
  }

  for (const s of body.schedules) {
    if (s.day_of_week < 0 || s.day_of_week > 6) {
      return NextResponse.json({ error: 'day_of_week harus 0–6.' }, { status: 400 });
    }
    if (s.end_time <= s.start_time) {
      return NextResponse.json(
        { error: 'Jam selesai harus lebih besar dari jam mulai.' },
        { status: 400 }
      );
    }
    if (
      (s.break_start && !s.break_end) ||
      (!s.break_start && s.break_end) ||
      (s.break_start && s.break_end && s.break_end <= s.break_start)
    ) {
      return NextResponse.json(
        { error: 'Jam istirahat mulai & selesai harus valid.' },
        { status: 400 }
      );
    }
  }

  const rows = body.schedules.map((s) => ({
    barber_id: body.barberId!,
    day_of_week: s.day_of_week,
    start_time: s.start_time,
    end_time: s.end_time,
    break_start: s.break_start || null,
    break_end: s.break_end || null,
    is_working: Boolean(s.is_working),
  }));

  const { data, error } = await auth.supabase
    .from('barber_schedules')
    .upsert(rows, { onConflict: 'barber_id,day_of_week' })
    .select('*')
    .order('day_of_week', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ schedules: data ?? [] });
}

