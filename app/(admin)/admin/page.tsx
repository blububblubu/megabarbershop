import Link from 'next/link';
import { requireAdminUser } from '@/lib/supabase/admin';
import { formatIndonesianDate, formatRupiah, getWibNowParts } from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { BookingWithRelations } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const auth = await requireAdminUser();
  if (!auth) return null;

  const wibNow = getWibNowParts();
  const todayStr = wibNow.dateStr;
  const monthStartStr = `${todayStr.slice(0, 7)}-01`;

  const [
    todayCountRes,
    pendingCountRes,
    confirmedCountRes,
    doneCountRes,
    monthCountRes,
    recentRes,
  ] = await Promise.all([
    auth.supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('booking_date', todayStr),
    auth.supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    auth.supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'confirmed'),
    auth.supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'done'),
    auth.supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('booking_date', monthStartStr),
    auth.supabase
      .from('bookings')
      .select(
        `
        *,
        service:services ( id, name, duration_minutes ),
        barber:barbers ( id, name, photo_url )
      `
      )
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const widgets = [
    { label: 'Booking Hari Ini', value: todayCountRes.count ?? 0 },
    { label: 'Menunggu Konfirmasi', value: pendingCountRes.count ?? 0 },
    { label: 'Terkonfirmasi', value: confirmedCountRes.count ?? 0 },
    { label: 'Selesai', value: doneCountRes.count ?? 0 },
    { label: 'Total Bulan Ini', value: monthCountRes.count ?? 0 },
  ];

  const recentBookings = (recentRes.data ?? []) as unknown as BookingWithRelations[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-brand-subtle">
          Ringkasan operasional hari ini ({formatIndonesianDate(todayStr)}).
        </p>
      </div>

      {/* 5 Widget Ringkasan (FR-12) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {widgets.map((w) => (
          <div
            key={w.label}
            className="bg-white border border-brand-border rounded-xl p-4 space-y-1"
          >
            <p className="text-xs text-brand-subtle">{w.label}</p>
            <p className="text-2xl font-bold">{w.value}</p>
          </div>
        ))}
      </div>

      {/* Booking Terbaru */}
      <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="font-semibold text-base">Booking Terbaru</h2>
          <Link
            href="/admin/bookings"
            className="text-xs font-medium text-brand-charcoal underline underline-offset-4"
          >
            Kelola Semua Booking →
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-brand-subtle">
            Belum ada data booking masuk.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-brand-muted text-xs text-brand-subtle uppercase">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Pelanggan</th>
                  <th className="px-4 py-3">Barber</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {recentBookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      {b.booking_code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.guest_name}</p>
                      <p className="text-xs text-brand-subtle">{b.guest_phone}</p>
                    </td>
                    <td className="px-4 py-3">{b.barber?.name ?? '-'}</td>
                    <td className="px-4 py-3">
                      <p>{b.booking_date}</p>
                      <p className="text-xs text-brand-subtle">
                        {b.start_time.slice(0, 5)} WIB
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatRupiah(b.price_snapshot)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

