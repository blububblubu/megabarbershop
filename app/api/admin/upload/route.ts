import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (foto & video MP4 galeri)
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]);

export async function POST(request: NextRequest) {
  const auth = await requireAdminUser();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const folder = String(formData.get('folder') ?? 'general').replace(
    /[^a-zA-Z0-9_-]/g,
    ''
  );

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'File gambar wajib diunggah.' },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Format file harus JPG, PNG, WebP, atau MP4.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Ukuran file maksimal 5MB.' },
      { status: 400 }
    );
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
      ? 'webp'
      : file.type === 'video/mp4'
      ? 'mp4'
      : 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const buffer = await file.arrayBuffer();
  const { error: uploadError } = await auth.supabase.storage
    .from('barbershop-media')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = auth.supabase.storage
    .from('barbershop-media')
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
}

