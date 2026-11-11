-- seed.sql
-- Data awal (placeholder + jadwal resmi) untuk demo SETARA Barbershop.
-- Aman dijalankan ulang (idempotent).

-- 1. Settings
INSERT INTO public.settings (key, value, type, "group") VALUES
  ('business_name', 'SETARA Barbershop', 'string', 'identity'),
  ('tagline', 'Potongan Rapi, Gaya Tetap Setara', 'string', 'identity'),
  ('logo_url', '', 'string', 'identity'),
  ('about_description', 'SETARA Barbershop adalah barbershop modern dengan sistem pemesanan slot waktu yang teratur, sehingga Anda tidak perlu mengantre lama. Layanan dapat diisi dan diperbarui kapan saja oleh admin.', 'text', 'content'),
  ('address', '[Alamat Lengkap SETARA Barbershop — ubah via Dashboard Admin]', 'text', 'contact'),
  ('whatsapp_number', '6287857697702', 'string', 'contact'),
  ('google_maps_embed_url', 'https://maps.google.com/maps?q=-8.165707,113.4496112+(SETARA+BARBERSHOP)&t=&z=17&ie=UTF8&iwloc=B&output=embed', 'text', 'contact'),
  ('google_maps_link', 'https://www.google.com/maps/place/SETARA+BARBERSHOP/@-8.165707,113.4447403,17z/data=!3m1!4b1!4m6!3m5!1s0x2dd68b6a0c719fd3:0x16181276698cffdc!8m2!3d-8.165707!4d113.4496112!16s%2Fg%2F11ypw93cb0!5m1!1e4?entry=ttu', 'text', 'contact'),
  ('slot_duration_minutes', '40', 'int', 'booking'),
  ('timezone', 'Asia/Jakarta', 'string', 'booking'),
  ('booking_min_lead_minutes', '30', 'int', 'booking'),
  ('booking_max_days_ahead', '14', 'int', 'booking'),
  ('max_pending_per_phone', '2', 'int', 'booking'),
  ('closed_days', '[0]', 'json', 'schedule'),
  ('operating_hours', '{"0":null,"1":{"open":"11:00","close":"21:00"},"2":{"open":"11:00","close":"21:00"},"3":{"open":"11:00","close":"21:00"},"4":{"open":"13:00","close":"21:00"},"5":{"open":"11:00","close":"21:00"},"6":{"open":"11:00","close":"21:00"}}', 'json', 'schedule')
ON CONFLICT (key) DO NOTHING;

-- 2. Layanan placeholder (hanya jika belum ada layanan)
INSERT INTO public.services (name, description, price, duration_minutes, is_active)
SELECT
  'Potong Rambut Pria',
  'Layanan potong rambut pria sesuai gaya pilihan Anda. Harga dan detail layanan dapat disesuaikan via dashboard admin.',
  30000,
  40,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.services);

-- 3. 2 Barber placeholder (hanya jika belum ada barber)
INSERT INTO public.barbers (name, bio, photo_url, is_active)
SELECT '[Barber 1]', 'Capster utama dengan potongan rapi dan presisi untuk gaya klasik maupun modern.', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM public.barbers WHERE name = '[Barber 1]');

INSERT INTO public.barbers (name, bio, photo_url, is_active)
SELECT '[Barber 2]', 'Capster berpengalaman dengan detail fade dan styling harian yang nyaman.', NULL, true
WHERE NOT EXISTS (SELECT 1 FROM public.barbers WHERE name = '[Barber 2]');

-- 4. Jadwal default untuk semua barber yang belum memiliki jadwal
-- 0=Senin (tutup), 1=Selasa..3=Kamis (11-21), 4=Jumat (13-21), 5=Sabtu..6=Minggu (11-21)
INSERT INTO public.barber_schedules (barber_id, day_of_week, start_time, end_time, break_start, break_end, is_working)
SELECT
  b.id,
  d.day_of_week,
  d.start_time,
  d.end_time,
  NULL,
  NULL,
  d.is_working
FROM public.barbers b
CROSS JOIN (
  VALUES
    (0::smallint, '11:00'::time, '21:00'::time, false),
    (1::smallint, '11:00'::time, '21:00'::time, true),
    (2::smallint, '11:00'::time, '21:00'::time, true),
    (3::smallint, '11:00'::time, '21:00'::time, true),
    (4::smallint, '13:00'::time, '21:00'::time, true),
    (5::smallint, '11:00'::time, '21:00'::time, true),
    (6::smallint, '11:00'::time, '21:00'::time, true)
) AS d(day_of_week, start_time, end_time, is_working)
ON CONFLICT (barber_id, day_of_week) DO NOTHING;

-- 5. Galeri placeholder (3 slot foto jika kosong)
INSERT INTO public.galleries (title, image_url, sort_order)
SELECT v.title, v.image_url, v.sort_order
FROM (
  VALUES
    ('Placeholder Interior Barbershop', '/images/placeholder-gallery-1.svg', 1),
    ('Placeholder Hasil Potongan', '/images/placeholder-gallery-2.svg', 2),
    ('Placeholder Area Tunggu', '/images/placeholder-gallery-3.svg', 3)
) AS v(title, image_url, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.galleries);

