-- 001_initial_schema.sql
-- Schema awal SETARA Barbershop (MVP v1.0)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'done', 'cancelled');
CREATE TYPE public.actor_type_enum AS ENUM ('guest', 'admin', 'system');

-- Helper trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. admin_users (terhubung ke auth.users)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. services
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL CHECK (price >= 0),
  duration_minutes integer NOT NULL DEFAULT 40 CHECK (duration_minutes > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. barbers
CREATE TABLE IF NOT EXISTS public.barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bio text NOT NULL DEFAULT '',
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_barbers_updated_at
BEFORE UPDATE ON public.barbers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. barber_schedules (day_of_week: 0 = Senin, 1 = Selasa, ..., 6 = Minggu)
CREATE TABLE IF NOT EXISTS public.barber_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  break_start time,
  break_end time,
  is_working boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (barber_id, day_of_week),
  CHECK (end_time > start_time),
  CHECK (
    (break_start IS NULL AND break_end IS NULL)
    OR (break_start IS NOT NULL AND break_end IS NOT NULL AND break_end > break_start)
  )
);

CREATE TRIGGER trg_barber_schedules_updated_at
BEFORE UPDATE ON public.barber_schedules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text NOT NULL UNIQUE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  barber_id uuid NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  guest_name text NOT NULL,
  guest_phone text NOT NULL,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price_snapshot integer NOT NULL CHECK (price_snapshot >= 0),
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. booking_status_logs
CREATE TABLE IF NOT EXISTS public.booking_status_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_type public.actor_type_enum NOT NULL,
  actor_id uuid,
  from_status public.booking_status,
  to_status public.booking_status NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. galleries
CREATE TABLE IF NOT EXISTS public.galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. settings (key-value)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  type text NOT NULL CHECK (type IN ('string', 'text', 'int', 'bool', 'json')),
  "group" text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes & Partial Unique Index (Anti Double-Booking)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_bookings_active_slot
  ON public.bookings (barber_id, booking_date, start_time)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_bookings_slot_lookup
  ON public.bookings (barber_id, booking_date, start_time);

CREATE INDEX IF NOT EXISTS idx_bookings_guest_phone_status
  ON public.bookings (guest_phone, status);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON public.bookings (status);

CREATE INDEX IF NOT EXISTS idx_barber_schedules_lookup
  ON public.barber_schedules (barber_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_galleries_sort_order
  ON public.galleries (sort_order);

