# SETARA Barbershop — Website Booking Online (MVP v1.0)

Sistem company profile dan booking slot waktu online berbasis **Next.js 14 (App Router)**, **Supabase (PostgreSQL + Auth + Storage)**, dan **Tailwind CSS**, mengacu pada [prd.md](./prd.md).

## 1. Setup Environment
Salin `.env.example` menjadi `.env.local` dan isi kredensial project Supabase Anda:

```bash
cp .env.example .env.local
```

Variabel yang dibutuhkan:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Migrasi Database & Seed Supabase
Jalankan file SQL berikut secara berurutan di **Supabase SQL Editor**:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_booking_rpc.sql`
4. `supabase/seed.sql`

## 3. Buat Akun Admin Demo
Setelah `.env.local` terisi dan migrasi dijalankan:

```bash
node scripts/seed-admin.mjs
```

Default kredensial (dapat diubah di `.env.local` via `ADMIN_SEED_EMAIL` & `ADMIN_SEED_PASSWORD`):
- Email: `admin@setarabarbershop.id`
- Password: `SetaraAdmin123!`

## 4. Menjalankan Lokal, Pengujian & Reset Demo
```bash
npm run dev                 # Jalankan development server di http://localhost:3000
npm test                    # Jalankan seluruh unit & API concurrency test (Vitest)
npm run test:e2e            # Jalankan Playwright E2E smoke & responsive test
npm run verify:supabase     # Uji koneksi live Supabase, bucket, & concurrency 2 request paralel
npm run build               # Verifikasi production build
node scripts/reset-demo.mjs # Bersihkan booking demo sebelum demo ulang ke klien
```

