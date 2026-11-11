'use client';

import { useEffect, useState } from 'react';
import { History, Loader2, Phone, Search, XCircle } from 'lucide-react';
import type { BookingWithRelations } from '@/types';
import {
  buildWhatsappUrl,
  formatIndonesianDate,
  formatRupiah,
} from '@/lib/utils/format';
import {
  getRecentBookingCodes,
  saveRecentBookingCode,
} from '@/lib/utils/recent-bookings';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function CheckBookingClient({
  initialCode,
  whatsappNumber,
  businessName,
}: {
  initialCode?: string;
  whatsappNumber: string;
  businessName: string;
}) {
  const [codeInput, setCodeInput] = useState(initialCode ?? '');
  const [recentCodes, setRecentCodes] = useState<string[]>([]);
  const [booking, setBooking] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [phoneLast4, setPhoneLast4] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function lookupCode(targetCode: string) {
    const clean = targetCode.trim().toUpperCase();
    if (!clean) return;
    setCodeInput(clean);
    setLoading(true);
    setErrorMsg(null);
    setBooking(null);
    try {
      const res = await fetch(
        `/api/check-booking?code=${encodeURIComponent(clean)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Kode booking tidak ditemukan.');
      } else {
        setBooking(data.booking);
        saveRecentBookingCode(clean);
        setRecentCodes(getRecentBookingCodes());
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRecentCodes(getRecentBookingCodes());
    if (initialCode) {
      lookupCode(initialCode);
    }
  }, [initialCode]);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setCancelError(null);
    setCancelling(true);
    try {
      const res = await fetch('/api/check-booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: booking.booking_code,
          phoneLast4,
          note: cancelReason || 'Dibatalkan oleh pelanggan',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error ?? 'Gagal membatalkan booking.');
        return;
      }
      setShowCancelModal(false);
      setPhoneLast4('');
      setCancelReason('');
      await lookupCode(booking.booking_code);
    } catch {
      setCancelError('Terjadi kesalahan jaringan.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          lookupCode(codeInput);
        }}
        className="bg-white border border-brand-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3"
      >
        <input
          type="text"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          placeholder="Masukkan kode booking (contoh: STR-20261110-ABCD)"
          className="flex-1 px-3.5 py-2.5 rounded-lg border border-brand-border text-sm font-mono uppercase"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Cek Status
        </button>
      </form>

      {recentCodes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-brand-subtle">
            <History className="w-3.5 h-3.5" />
            Booking terakhir di perangkat ini:
          </span>
          {recentCodes.map((rc) => (
            <button
              key={rc}
              type="button"
              onClick={() => lookupCode(rc)}
              className="px-2.5 py-1 rounded-md border border-brand-border bg-white font-mono font-medium hover:border-brand-charcoal transition-colors"
            >
              {rc}
            </button>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {booking && (
        <div className="bg-white border border-brand-border rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-brand-border">
            <div>
              <p className="text-xs text-brand-subtle uppercase font-medium">
                Kode Booking
              </p>
              <p className="text-xl font-mono font-bold">
                {booking.booking_code}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <dl className="divide-y divide-brand-border text-sm">
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-brand-subtle">Nama</dt>
              <dd className="font-medium text-right">{booking.guest_name}</dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-brand-subtle">Layanan</dt>
              <dd className="font-medium text-right">
                {booking.service?.name ?? '-'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-brand-subtle">Barber</dt>
              <dd className="font-medium text-right">
                {booking.barber?.name ?? '-'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-brand-subtle">Tanggal</dt>
              <dd className="font-medium text-right">
                {formatIndonesianDate(booking.booking_date)}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4">
              <dt className="text-brand-subtle">Waktu</dt>
              <dd className="font-medium text-right">
                {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)} WIB
              </dd>
            </div>
            <div className="py-2.5 flex justify-between gap-4 font-semibold">
              <dt>Harga</dt>
              <dd>{formatRupiah(booking.price_snapshot)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={buildWhatsappUrl(
                whatsappNumber,
                `Halo Admin ${businessName}, saya ingin menanyakan status booking ${booking.booking_code}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
            >
              <Phone className="w-4 h-4" />
              Hubungi WhatsApp Admin
            </a>

            {booking.status === 'pending' && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Batalkan Booking
              </button>
            )}
          </div>
        </div>
      )}

      {showCancelModal && booking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCancel}
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 className="text-lg font-bold">Batalkan Booking</h3>
            <p className="text-sm text-brand-subtle">
              Masukkan <strong>4 digit terakhir nomor WhatsApp</strong> yang digunakan saat memesan kode{' '}
              <span className="font-mono font-semibold">{booking.booking_code}</span>.
            </p>

            <div>
              <label className="block text-xs font-medium text-brand-subtle mb-1">
                4 Digit Terakhir Nomor WA *
              </label>
              <input
                type="text"
                maxLength={4}
                pattern="\d{4}"
                value={phoneLast4}
                onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 7890"
                required
                className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-brand-subtle mb-1">
                Alasan (Opsional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Contoh: Berhalangan hadir"
                className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
              />
            </div>

            {cancelError && (
              <p className="text-xs text-red-600">{cancelError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-lg border border-brand-border text-sm"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={cancelling || phoneLast4.length !== 4}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {cancelling ? 'Membatalkan...' : 'Konfirmasi Batal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

