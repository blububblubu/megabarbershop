/**
 * Verifikasi koneksi live Supabase, 8 tabel, storage bucket, dan uji concurrency RPC
 * (2 request paralel memesan slot yang sama -> tepat 1 berhasil, 1 ditolak SLOT_UNAVAILABLE).
 * Jalankan setelah .env.local terisi dan migrasi + seed dijalankan:
 *   node scripts/verify-supabase.mjs
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

if (!url || !serviceKey || url.includes('your-project-id')) {
  console.error('Error: Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY yang valid di .env.local terlebih dahulu.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function findNextTuesdayWib() {
  const now = new Date();
  for (let offset = 1; offset <= 10; offset++) {
    const dt = new Date(now.getTime() + offset * 86_400_000);
    const wibStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dt);
    const [y, m, d] = wibStr.split('-').map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (day === 2) return wibStr; // Selasa (buka 11:00–21:00)
  }
  throw new Error('Gagal mencari tanggal Selasa berikutnya.');
}

async function main() {
  console.log('1. Memeriksa 8 tabel utama...');
  const tables = [
    'admin_users',
    'services',
    'barbers',
    'barber_schedules',
    'bookings',
    'booking_status_logs',
    'galleries',
    'settings',
  ];

  for (const tbl of tables) {
    const { error } = await supabase.from(tbl).select('id', { head: true, count: 'exact' });
    if (error) {
      throw new Error(`Tabel "${tbl}" gagal diakses: ${error.message}`);
    }
  }
  console.log('   OK: Semua 8 tabel tersedia.');

  console.log('2. Memeriksa Storage bucket barbershop-media...');
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) throw new Error(`Gagal cek bucket: ${bucketErr.message}`);
  if (!buckets.some((b) => b.id === 'barbershop-media')) {
    throw new Error('Bucket "barbershop-media" belum ada. Jalankan 002_rls_policies.sql.');
  }
  console.log('   OK: Bucket barbershop-media siap.');

  console.log('3. Menguji concurrency (2 request paralel create_booking_atomic pada slot sama)...');
  const [{ data: svc }, { data: brb }] = await Promise.all([
    supabase.from('services').select('id').eq('is_active', true).limit(1).single(),
    supabase.from('barbers').select('id').eq('is_active', true).limit(1).single(),
  ]);

  if (!svc || !brb) {
    throw new Error('Data seed services/barbers belum ada. Jalankan supabase/seed.sql.');
  }

  const testDate = findNextTuesdayWib();
  const [resA, resB] = await Promise.all([
    supabase.rpc('create_booking_atomic', {
      p_service_id: svc.id,
      p_barber_id: brb.id,
      p_booking_date: testDate,
      p_start_time: '15:00:00',
      p_guest_name: 'Test Concurrency A',
      p_guest_phone: '628999990001',
      p_notes: 'Automated live concurrency check',
    }),
    supabase.rpc('create_booking_atomic', {
      p_service_id: svc.id,
      p_barber_id: brb.id,
      p_booking_date: testDate,
      p_start_time: '15:00:00',
      p_guest_name: 'Test Concurrency B',
      p_guest_phone: '628999990002',
      p_notes: 'Automated live concurrency check',
    }),
  ]);

  const successes = [resA, resB].filter((r) => !r.error && r.data);
  const failures = [resA, resB].filter((r) => r.error);

  // Bersihkan booking test yang sempat masuk
  for (const s of successes) {
    await supabase.from('bookings').delete().eq('id', s.data.id);
  }

  if (successes.length !== 1 || failures.length !== 1) {
    throw new Error(
      `Uji concurrency gagal! Sukses: ${successes.length}, Gagal: ${failures.length}`
    );
  }

  console.log(
    `   OK: Concurrency terjamin (1 berhasil [${successes[0].data.booking_code}], 1 ditolak [${failures[0].error.message}]). Data uji sudah dibersihkan.`
  );
  console.log('Semua pemeriksaan live Supabase LULUS!');
}

main().catch((err) => {
  console.error('VERIFIKASI GAGAL:', err.message);
  process.exit(1);
});

