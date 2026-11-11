import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string | null;
    image_url?: string;
    sort_order?: number;
  };

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title?.trim() || null;
  if (body.image_url !== undefined) updates.image_url = body.image_url.trim();
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);

  const { data, error } = await auth.supabase
    .from('galleries')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ gallery: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await auth.supabase
    .from('galleries')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

