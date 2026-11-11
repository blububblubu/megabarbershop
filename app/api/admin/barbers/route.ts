import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_BARBER_WEEK = [
  { day_of_week: 0, start_time: '11:00', end_time: '21:00', is_working: false },
  { day_of_week: 1, start_time: '11:00', end_time: '21:00', is_working: true },
  { day_of_week: 2, start_time: '11:00', end_time: '21:00', is_working: true },
  { day_of_week: 3, start_time: '11:00', end_time: '21:00', is_working: true },
  { day_of_week: 4, start_time: '13:00', end_time: '21:00', is_working: true },
  { day_of_week: 5, start_time: '11:00', end_time: '21:00', is_working: true },
  { day_of_week: 6, start_time: '11:00', end_time: '21:00', is_working: true },
];

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from('barbers')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ barbers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    bio?: string;
    photo_url?: string | null;
    is_active?: boolean;
  };

  const name = body.name?.trim() ?? '';
  if (name.length < 2) {
    return NextResponse.json(
      { error: 'Nama barber minimal 2 karakter.' },
      { status: 400 }
    );
  }

  const { data: barber, error } = await auth.supabase
    .from('barbers')
    .insert({
      name,
      bio: body.bio?.trim() ?? '',
      photo_url: body.photo_url?.trim() || null,
      is_active: body.is_active ?? true,
    })
    .select('*')
    .single();

  if (error || !barber) {
    return NextResponse.json(
      { error: error?.message ?? 'Gagal menambah barber.' },
      { status: 500 }
    );
  }

  // Inisialisasi jadwal default 7 hari agar barber langsung siap dibooking
  await auth.supabase.from('barber_schedules').insert(
    DEFAULT_BARBER_WEEK.map((d) => ({
      barber_id: barber.id,
      day_of_week: d.day_of_week,
      start_time: d.start_time,
      end_time: d.end_time,
      break_start: null,
      break_end: null,
      is_working: d.is_working,
    }))
  );

  return NextResponse.json({ barber }, { status: 201 });
}

