import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from('settings')
    .select('*')
    .order('group', { ascending: true })
    .order('key', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    items?: Array<{ key: string; value: string; type?: string; group?: string }>;
  };

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { error: 'Daftar settings wajib diisi.' },
      { status: 400 }
    );
  }

  const rows = body.items.map((item) => ({
    key: item.key,
    value: String(item.value ?? ''),
    type: item.type ?? 'string',
    group: item.group ?? 'identity',
  }));

  const { data, error } = await auth.supabase
    .from('settings')
    .upsert(rows, { onConflict: 'key' })
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data ?? [] });
}

