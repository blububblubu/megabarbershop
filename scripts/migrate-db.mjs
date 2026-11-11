/**
 * Menjalankan seluruh migrasi SQL + seed langsung ke PostgreSQL Supabase
 * (melewati SQL parser browser Supabase Dashboard).
 * Jalankan: node scripts/migrate-db.mjs
 * Membutuhkan DATABASE_URL di .env.local (Session Pooler URI dari Supabase -> Connect).
 */
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL belum diisi di .env.local');
  process.exit(1);
}

const files = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/migrations/003_booking_rpc.sql',
  'supabase/seed.sql',
];

async function main() {
  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Terhubung ke Supabase PostgreSQL.');

  try {
    for (const relPath of files) {
      const fullPath = path.resolve(process.cwd(), relPath);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`Menjalankan ${relPath}...`);
      await client.query(sql);
      console.log(`  OK: ${relPath}`);
    }
    console.log('Semua migrasi dan seed selesai dijalankan!');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migrasi gagal:', err.message);
  process.exit(1);
});

