import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

export function isServiceRoleConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Client dengan Service Role Key (hanya untuk server-side API routes).
 * Digunakan untuk operasi guest (availability tanpa bocor data pribadi,
 * booking RPC, check-booking by code) karena RLS menutup akses langsung anon ke `bookings`.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.'
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Memastikan request berasal dari admin yang terautentikasi & terdaftar di `admin_users`.
 */
export async function requireAdminUser() {
  const supabase = createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('id, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!adminRecord) {
    return null;
  }

  return { user, adminRecord, supabase };
}

