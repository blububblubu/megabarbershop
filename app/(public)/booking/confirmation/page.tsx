import Link from 'next/link';
import { CheckCircle2, Phone, Search } from 'lucide-react';
import { getPublicBookingByCode } from '@/lib/services/booking-service';
import { getBusinessSettings } from '@/lib/services/settings-service';
import {
  buildWhatsappUrl,
  formatIndonesianDate,
  formatRupiah,
} from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BookingConfirmationActions } from '@/components/booking/BookingConfirmationActions';

export const dynamic = 'force-dynamic';

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const code = searchParams.code?.trim() ?? '';
  const [bookingRes, settings] = await Promise.all([
    code
      ? getPublicBookingByCode(code)
      : Promise.resolve<{
          data?: import('@/types').BookingWithRelations;
          error?: string;
          statusCode: number;
        }>({ error: 'Kode booking tidak tersedia.', statusCode: 400 }),
    getBusinessSettings(),
  ]);

  if (!bookingRes.data) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold">Ringkasan Booking Tidak Ditemukan</h1>
        <p className="text-sm text-brand-subtle">
          {bookingRes.error ?? 'Pastikan kode booking Anda benar.'}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/check-booking"
            className="px-4 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium"
          >
            Cek Status Booking
          </Link>
          <Link
            href="/booking"
            className="px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium"
          >
            Booking Baru
          </Link>
        </div>
      </div>
    );
  }

  const booking = bookingRes.data;
  const waMessage = [
    `Halo Admin ${settings.businessName}, saya baru membuat booking:`,
    `Kode: ${booking.booking_code}`,
    `Nama: ${booking.guest_name}`,
    `Layanan: ${booking.service?.name ?? '-'}`,
    `Barber: ${booking.barber?.name ?? '-'}`,
    `Tanggal: ${formatIndonesianDate(booking.booking_date)}`,
    `Jam: ${booking.start_time.slice(0, 5)} – ${booking.end_time.slice(0, 5)} WIB`,
    `Mohon konfirmasinya. Terima kasih!`,
  ].join('\n');

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="bg-white border border-brand-border rounded-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Booking Berhasil Dibuat
            </h1>
            <p className="text-sm text-brand-subtle">
              Simpan atau screenshot kode booking di bawah ini sebagai bukti pemesanan dan untuk mengecek status.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-brand-muted border border-brand-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-brand-subtle uppercase font-medium">
              Kode Booking Unik
            </p>
            <p className="text-2xl font-mono font-bold tracking-wider">
              {booking.booking_code}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <BookingConfirmationActions code={booking.booking_code} />
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <dl className="divide-y divide-brand-border text-sm">
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-brand-subtle">Nama Pemesan</dt>
            <dd className="font-medium text-right">{booking.guest_name}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-brand-subtle">Nomor WhatsApp</dt>
            <dd className="font-medium text-right">{booking.guest_phone}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-brand-subtle">Layanan</dt>
            <dd className="font-medium text-right">{booking.service?.name ?? '-'}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-brand-subtle">Barber</dt>
            <dd className="font-medium text-right">{booking.barber?.name ?? '-'}</dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-brand-subtle">Tanggal</dt>
            <dd className="font-medium text-right">
              {formatIndonesianDate(booking.booking_date)}
            </dd>
          </div>
          <div className="py-2.5 flex justify-between gap-4">
            <dt className="text-brand-subtle">Slot Waktu</dt>
            <dd className="font-medium text-right">
              {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)} WIB
            </dd>
          </div>
          {booking.notes && (
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-brand-subtle">Catatan</dt>
              <dd className="font-medium text-right">{booking.notes}</dd>
            </div>
          )}
          <div className="py-3 flex justify-between gap-4 text-base font-bold">
            <dt>Total (Bayar di Tempat)</dt>
            <dd>{formatRupiah(booking.price_snapshot)}</dd>
          </div>
        </dl>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href={buildWhatsappUrl(settings.whatsappNumber, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
          >
            <Phone className="w-4 h-4" />
            Konfirmasi via WhatsApp Admin
          </a>
          <Link
            href={`/check-booking?code=${encodeURIComponent(booking.booking_code)}`}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-brand-border text-sm font-medium hover:bg-brand-muted"
          >
            <Search className="w-4 h-4" />
            Cek Status Booking
          </Link>
        </div>
      </div>
    </div>
  );
}
