/**
 * Backup plan demo: reset seluruh data booking & kembalikan placeholder demo awal.
 * Jalankan: node scripts/reset-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('Membersihkan data booking & audit log demo...');
  await supabase.from('booking_status_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: delBookingsErr } = await supabase
    .from('bookings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (delBookingsErr) {
    console.error('Gagal menghapus bookings:', delBookingsErr.message);
    process.exit(1);
  }

  console.log('Data booking bersih. Jalankan supabase/seed.sql jika perlu memulihkan katalog placeholder.');
}

main();

