-- 002_rls_policies.sql
-- Row Level Security (RLS) dan Storage Bucket untuk SETARA Barbershop

-- Helper untuk cek apakah user yang login terdaftar sebagai admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    );
$$;

-- Aktifkan RLS di semua tabel
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- admin_users: hanya admin dapat membaca data admin
CREATE POLICY "admin_users_select_admin"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

-- services: publik hanya baca active; admin kelola semua
CREATE POLICY "services_select_public_active"
  ON public.services FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "services_all_admin"
  ON public.services FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- barbers: publik hanya baca active; admin kelola semua
CREATE POLICY "barbers_select_public_active"
  ON public.barbers FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "barbers_all_admin"
  ON public.barbers FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- barber_schedules: publik bisa baca jadwal untuk cek ketersediaan; admin kelola semua
CREATE POLICY "barber_schedules_select_public"
  ON public.barber_schedules FOR SELECT
  USING (true);

CREATE POLICY "barber_schedules_all_admin"
  ON public.barber_schedules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- bookings: TIDAK ada akses SELECT/INSERT/UPDATE/DELETE langsung untuk anon.
-- Semua aksi publik lewat server-side API + RPC SECURITY DEFINER agar data guest tidak bocor.
CREATE POLICY "bookings_all_admin"
  ON public.bookings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- booking_status_logs: hanya admin yang bisa baca; insert lewat RPC / admin
CREATE POLICY "booking_status_logs_select_admin"
  ON public.booking_status_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "booking_status_logs_insert_admin"
  ON public.booking_status_logs FOR INSERT
  WITH CHECK (public.is_admin());

-- galleries: publik bisa baca; admin kelola semua
CREATE POLICY "galleries_select_public"
  ON public.galleries FOR SELECT
  USING (true);

CREATE POLICY "galleries_all_admin"
  ON public.galleries FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- settings: publik bisa baca info bisnis/operasional; admin kelola semua
CREATE POLICY "settings_select_public"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "settings_all_admin"
  ON public.settings FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Storage Bucket untuk foto barber, logo & galeri (max 5MB, JPG/PNG/WebP/MP4)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-media',
  'barbershop-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "storage_public_read_media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barbershop-media');

CREATE POLICY "storage_admin_insert_media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'barbershop-media' AND public.is_admin());

CREATE POLICY "storage_admin_update_media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'barbershop-media' AND public.is_admin());

CREATE POLICY "storage_admin_delete_media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'barbershop-media' AND public.is_admin());

