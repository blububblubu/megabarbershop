-- 003_booking_rpc.sql
-- Fungsi RPC atomik untuk pembuatan booking, pembatalan guest, dan update status admin

-- Generator kode unik format STR-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION public.generate_booking_code(p_date date)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  date_part text := to_char(p_date, 'YYYYMMDD');
  suffix text;
  candidate text;
  i int;
BEGIN
  LOOP
    suffix := '';
    FOR i IN 1..4 LOOP
      suffix := suffix || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    candidate := 'STR-' || date_part || '-' || suffix;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.bookings WHERE booking_code = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

-- Helper membaca setting integer dengan fallback
CREATE OR REPLACE FUNCTION public.get_setting_int(p_key text, p_default integer)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT value::integer FROM public.settings WHERE key = p_key LIMIT 1),
    p_default
  );
$$;

-- RPC atomik pembuatan booking (anti double-booking + validasi jadwal & batas pending)
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_service_id uuid,
  p_barber_id uuid,
  p_booking_date date,
  p_start_time time,
  p_guest_name text,
  p_guest_phone text,
  p_notes text DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service public.services%ROWTYPE;
  v_barber public.barbers%ROWTYPE;
  v_schedule public.barber_schedules%ROWTYPE;
  v_slot_duration integer;
  v_min_lead integer;
  v_max_days integer;
  v_max_pending integer;
  v_end_time time;
  v_now_wib timestamp;
  v_today_wib date;
  v_slot_ts timestamp;
  v_day_of_week smallint;
  v_closed_days jsonb;
  v_operating_hours jsonb;
  v_day_hours jsonb;
  v_store_open time;
  v_store_close time;
  v_pending_count integer;
  v_booking_code text;
  v_created public.bookings%ROWTYPE;
BEGIN
  -- Normalisasi & validasi input dasar
  IF length(trim(coalesce(p_guest_name, ''))) < 2 THEN
    RAISE EXCEPTION 'INVALID_GUEST_NAME';
  END IF;

  IF length(regexp_replace(coalesce(p_guest_phone, ''), '\D', '', 'g')) < 9 THEN
    RAISE EXCEPTION 'INVALID_GUEST_PHONE';
  END IF;

  -- Lock baris barber untuk mencegah race condition pembuatan slot baru pada waktu bersamaan
  SELECT * INTO v_barber
  FROM public.barbers
  WHERE id = p_barber_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BARBER_NOT_FOUND';
  END IF;

  -- Ambil layanan aktif
  SELECT * INTO v_service
  FROM public.services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SERVICE_NOT_FOUND';
  END IF;

  -- Ambil konfigurasi settings
  v_slot_duration := public.get_setting_int('slot_duration_minutes', 40);
  v_min_lead := public.get_setting_int('booking_min_lead_minutes', 30);
  v_max_days := public.get_setting_int('booking_max_days_ahead', 14);
  v_max_pending := public.get_setting_int('max_pending_per_phone', 2);

  v_now_wib := (now() AT TIME ZONE 'Asia/Jakarta');
  v_today_wib := v_now_wib::date;
  v_slot_ts := (p_booking_date::timestamp + p_start_time);
  v_end_time := (p_start_time + make_interval(mins => v_slot_duration));

  -- Validasi rentang tanggal (hari ini s/d H+14) & lead time minimum (30 menit)
  IF p_booking_date < v_today_wib OR p_booking_date > (v_today_wib + v_max_days) THEN
    RAISE EXCEPTION 'DATE_OUT_OF_RANGE';
  END IF;

  IF v_slot_ts < (v_now_wib + make_interval(mins => v_min_lead)) THEN
    RAISE EXCEPTION 'SLOT_TOO_SOON_OR_PASSED';
  END IF;

  -- Konversi Postgres ISODOW (1=Senin..7=Minggu) ke 0=Senin..6=Minggu
  v_day_of_week := (EXTRACT(ISODOW FROM p_booking_date)::integer - 1)::smallint;

  -- Cek hari tutup global di settings
  SELECT COALESCE((SELECT value::jsonb FROM public.settings WHERE key = 'closed_days' LIMIT 1), '[]'::jsonb)
  INTO v_closed_days;

  IF v_closed_days @> to_jsonb(v_day_of_week::integer) THEN
    RAISE EXCEPTION 'STORE_CLOSED';
  END IF;

  -- Cek jam operasional global hari tersebut
  SELECT COALESCE((SELECT value::jsonb FROM public.settings WHERE key = 'operating_hours' LIMIT 1), '{}'::jsonb)
  INTO v_operating_hours;

  v_day_hours := v_operating_hours -> (v_day_of_week::text);
  IF v_day_hours IS NULL OR v_day_hours = 'null'::jsonb THEN
    RAISE EXCEPTION 'STORE_CLOSED';
  END IF;

  v_store_open := (v_day_hours ->> 'open')::time;
  v_store_close := (v_day_hours ->> 'close')::time;

  IF p_start_time < v_store_open OR v_end_time > v_store_close THEN
    RAISE EXCEPTION 'OUTSIDE_OPERATING_HOURS';
  END IF;

  -- Cek jadwal barber pada hari tersebut
  SELECT * INTO v_schedule
  FROM public.barber_schedules
  WHERE barber_id = p_barber_id AND day_of_week = v_day_of_week;

  IF NOT FOUND OR v_schedule.is_working = false THEN
    RAISE EXCEPTION 'BARBER_NOT_WORKING';
  END IF;

  IF p_start_time < v_schedule.start_time OR v_end_time > v_schedule.end_time THEN
    RAISE EXCEPTION 'OUTSIDE_BARBER_SCHEDULE';
  END IF;

  IF v_schedule.break_start IS NOT NULL AND v_schedule.break_end IS NOT NULL THEN
    IF p_start_time < v_schedule.break_end AND v_end_time > v_schedule.break_start THEN
      RAISE EXCEPTION 'INSIDE_BARBER_BREAK';
    END IF;
  END IF;

  -- Cek batas maksimal booking PENDING per nomor WhatsApp
  SELECT count(*) INTO v_pending_count
  FROM public.bookings
  WHERE guest_phone = p_guest_phone
    AND status = 'pending';

  IF v_pending_count >= v_max_pending THEN
    RAISE EXCEPTION 'MAX_PENDING_REACHED';
  END IF;

  -- Cek ketersediaan slot (pending/confirmed)
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE barber_id = p_barber_id
      AND booking_date = p_booking_date
      AND start_time = p_start_time
      AND status IN ('pending', 'confirmed')
  ) THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;

  v_booking_code := public.generate_booking_code(p_booking_date);

  INSERT INTO public.bookings (
    booking_code,
    service_id,
    barber_id,
    guest_name,
    guest_phone,
    booking_date,
    start_time,
    end_time,
    price_snapshot,
    status,
    notes
  )
  VALUES (
    v_booking_code,
    p_service_id,
    p_barber_id,
    trim(p_guest_name),
    p_guest_phone,
    p_booking_date,
    p_start_time,
    v_end_time,
    v_service.price,
    'pending',
    NULLIF(trim(coalesce(p_notes, '')), '')
  )
  RETURNING * INTO v_created;

  INSERT INTO public.booking_status_logs (
    booking_id,
    actor_type,
    actor_id,
    from_status,
    to_status,
    note
  )
  VALUES (
    v_created.id,
    'guest',
    NULL,
    NULL,
    'pending',
    'Booking dibuat oleh pelanggan'
  );

  RETURN v_created;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
END;
$$;

-- RPC pembatalan booking PENDING oleh guest (dengan verifikasi 4 digit terakhir no. WA)
CREATE OR REPLACE FUNCTION public.cancel_booking_by_guest(
  p_booking_code text,
  p_phone_last4 text,
  p_note text DEFAULT 'Dibatalkan oleh pelanggan'
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_digits text;
  v_clean_last4 text;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE upper(booking_code) = upper(trim(p_booking_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  IF v_booking.status <> 'pending' THEN
    RAISE EXCEPTION 'CANNOT_CANCEL_NON_PENDING';
  END IF;

  v_digits := regexp_replace(v_booking.guest_phone, '\D', '', 'g');
  v_clean_last4 := regexp_replace(coalesce(p_phone_last4, ''), '\D', '', 'g');

  IF length(v_clean_last4) <> 4 OR right(v_digits, 4) <> v_clean_last4 THEN
    RAISE EXCEPTION 'PHONE_VERIFICATION_FAILED';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  INSERT INTO public.booking_status_logs (
    booking_id,
    actor_type,
    actor_id,
    from_status,
    to_status,
    note
  )
  VALUES (
    v_booking.id,
    'guest',
    NULL,
    'pending',
    'cancelled',
    COALESCE(NULLIF(trim(p_note), ''), 'Dibatalkan oleh pelanggan')
  );

  RETURN v_booking;
END;
$$;

-- RPC perubahan status booking oleh admin (menjamin audit trail di booking_status_logs)
CREATE OR REPLACE FUNCTION public.update_booking_status_admin(
  p_booking_id uuid,
  p_new_status public.booking_status,
  p_admin_id uuid,
  p_note text DEFAULT NULL
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_old_status public.booking_status;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.admin_users WHERE id = p_admin_id) THEN
    RAISE EXCEPTION 'UNAUTHORIZED_ADMIN';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BOOKING_NOT_FOUND';
  END IF;

  v_old_status := v_booking.status;

  IF NOT (
    (v_old_status = 'pending' AND p_new_status IN ('confirmed', 'cancelled')) OR
    (v_old_status = 'confirmed' AND p_new_status IN ('done', 'cancelled'))
  ) THEN
    RAISE EXCEPTION 'INVALID_STATUS_TRANSITION';
  END IF;

  IF p_new_status = 'cancelled' AND length(trim(coalesce(p_note, ''))) = 0 THEN
    RAISE EXCEPTION 'CANCEL_NOTE_REQUIRED';
  END IF;

  UPDATE public.bookings
  SET status = p_new_status
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  INSERT INTO public.booking_status_logs (
    booking_id,
    actor_type,
    actor_id,
    from_status,
    to_status,
    note
  )
  VALUES (
    v_booking.id,
    'admin',
    p_admin_id,
    v_old_status,
    p_new_status,
    NULLIF(trim(coalesce(p_note, '')), '')
  );

  RETURN v_booking;
END;
$$;

