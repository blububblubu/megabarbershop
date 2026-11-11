/**
 * Script untuk membuat akun Admin pertama di Supabase Auth & tabel admin_users.
 * Jalankan: node scripts/seed-admin.mjs
 * Pastikan .env.local sudah terisi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.
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
const email = process.env.ADMIN_SEED_EMAIL || 'admin@setarabarbershop.id';
const password = process.env.ADMIN_SEED_PASSWORD || 'SetaraAdmin123!';

if (!url || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error('Gagal memeriksa user:', listErr.message);
    process.exit(1);
  }

  let userId = listData.users.find((u) => u.email === email)?.id;

  if (!userId) {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      console.error('Gagal membuat admin auth user:', createErr?.message);
      process.exit(1);
    }
    userId = created.user.id;
    console.log(`Auth user dibuat: ${email} (${userId})`);
  } else {
    console.log(`Auth user sudah ada: ${email} (${userId})`);
  }

  const { error: insertErr } = await supabase
    .from('admin_users')
    .upsert({ id: userId, email }, { onConflict: 'id' });

  if (insertErr) {
    console.error('Gagal mendaftarkan ke admin_users:', insertErr.message);
    process.exit(1);
  }

  console.log(`Sukses! Admin siap login dengan email: ${email}`);
}

main();

