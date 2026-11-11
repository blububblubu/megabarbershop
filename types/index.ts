export type BookingStatus = 'pending' | 'confirmed' | 'done' | 'cancelled';
export type ActorType = 'guest' | 'admin' | 'system';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Barber {
  id: string;
  name: string;
  bio: string;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BarberSchedule {
  id: string;
  barber_id: string;
  day_of_week: number; // 0 = Senin, 6 = Minggu
  start_time: string;  // HH:mm:ss
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_working: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  booking_code: string;
  service_id: string;
  barber_id: string;
  guest_name: string;
  guest_phone: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string;   // HH:mm:ss
  end_time: string;
  price_snapshot: number;
  status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithRelations extends Booking {
  service?: Pick<Service, 'id' | 'name' | 'duration_minutes'> | null;
  barber?: Pick<Barber, 'id' | 'name' | 'photo_url'> | null;
}

export interface BookingStatusLog {
  id: string;
  booking_id: string;
  actor_type: ActorType;
  actor_id: string | null;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  note: string | null;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string | null;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface SettingItem {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'text' | 'int' | 'bool' | 'json';
  group: string;
  created_at: string;
  updated_at: string;
}

export interface DayOperatingHours {
  open: string;  // HH:mm
  close: string; // HH:mm
}

export type OperatingHoursMap = Record<string, DayOperatingHours | null>;

export interface TimeSlotOption {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  available: boolean;
}

