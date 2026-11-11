import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from('galleries')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ galleries: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string | null;
    image_url?: string;
    sort_order?: number;
  };

  const imageUrl = body.image_url?.trim() ?? '';
  if (!imageUrl) {
    return NextResponse.json(
      { error: 'URL gambar wajib diisi.' },
      { status: 400 }
    );
  }

  const { data, error } = await auth.supabase
    .from('galleries')
    .insert({
      title: body.title?.trim() || null,
      image_url: imageUrl,
      sort_order: Number(body.sort_order ?? 0),
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gallery: data }, { status: 201 });
}

