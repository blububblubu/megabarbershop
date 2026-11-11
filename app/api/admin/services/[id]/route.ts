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
    description?: string;
    price?: number;
    duration_minutes?: number;
    is_active?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) {
    if (body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nama layanan minimal 2 karakter.' },
        { status: 400 }
      );
    }
    updates.name = body.name.trim();
  }
  if (body.description !== undefined) {
    updates.description = body.description.trim();
  }
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isInteger(price) || price < 0) {
      return NextResponse.json(
        { error: 'Harga harus bilangan bulat >= 0.' },
        { status: 400 }
      );
    }
    updates.price = price;
  }
  if (body.duration_minutes !== undefined) {
    const dur = Number(body.duration_minutes);
    if (!Number.isInteger(dur) || dur <= 0) {
      return NextResponse.json(
        { error: 'Durasi harus > 0 menit.' },
        { status: 400 }
      );
    }
    updates.duration_minutes = dur;
  }
  if (body.is_active !== undefined) {
    updates.is_active = Boolean(body.is_active);
  }

  const { data, error } = await auth.supabase
    .from('services')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ service: data });
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
    .from('services')
    .delete()
    .eq('id', params.id);

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json(
        {
          error:
            'Layanan sudah memiliki riwayat booking sehingga tidak dapat dihapus. Nonaktifkan status layanan sebagai gantinya.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}

