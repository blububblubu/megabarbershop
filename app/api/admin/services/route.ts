import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from('services')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ services: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    price?: number;
    duration_minutes?: number;
    is_active?: boolean;
  };

  const name = body.name?.trim() ?? '';
  const price = Number(body.price);
  const durationMinutes = Number(body.duration_minutes ?? 40);

  if (name.length < 2) {
    return NextResponse.json(
      { error: 'Nama layanan minimal 2 karakter.' },
      { status: 400 }
    );
  }
  if (!Number.isInteger(price) || price < 0) {
    return NextResponse.json(
      { error: 'Harga harus bilangan bulat >= 0.' },
      { status: 400 }
    );
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return NextResponse.json(
      { error: 'Durasi harus > 0 menit.' },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from('services')
    .insert({
      name,
      description: body.description?.trim() ?? '',
      price,
      duration_minutes: durationMinutes,
      is_active: body.is_active ?? true,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ service: data }, { status: 201 });
}

