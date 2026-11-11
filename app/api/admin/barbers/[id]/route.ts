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
    name?: string;
    bio?: string;
    photo_url?: string | null;
    is_active?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nama barber minimal 2 karakter.' },
        { status: 400 }
      );
    }
    updates.name = body.name.trim();
  }
  if (body.bio !== undefined) updates.bio = body.bio.trim();
  if (body.photo_url !== undefined) updates.photo_url = body.photo_url?.trim() || null;
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  const { data, error } = await auth.supabase
    .from('barbers')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ barber: data });
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
    .from('barbers')
    .delete()
    .eq('id', params.id);

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error:
            'Barber memiliki riwayat booking sehingga tidak dapat dihapus. Nonaktifkan status barber sebagai gantinya.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

