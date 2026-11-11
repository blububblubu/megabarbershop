'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, Loader2, Phone, X } from 'lucide-react';
import type {
  Barber,
  BookingStatus,
  BookingStatusLog,
  BookingWithRelations,
} from '@/types';
import {
  buildWhatsappUrl,
  formatIndonesianDate,
  formatRupiah,
} from '@/lib/utils/format';
import { StatusBadge } from '@/components/ui/StatusBadge';

function buildCustomerStatusWaUrl(
  booking: BookingWithRelations,
  logs: BookingStatusLog[]
): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : '';
  const checkUrl = `${origin}/check-booking?code=${encodeURIComponent(
    booking.booking_code
  )}`;
  const dateLabel = formatIndonesianDate(booking.booking_date);
  const timeLabel = `${booking.start_time.slice(0, 5)} – ${booking.end_time.slice(0, 5)} WIB`;

  if (booking.status === 'confirmed') {
    const msg = [
      `Halo ${booking.guest_name},`,
      `Booking Anda di SETARA Barbershop telah *DIKONFIRMASI*:`,
      `• Kode: ${booking.booking_code}`,
      `• Layanan: ${booking.service?.name ?? '-'}`,
      `• Barber: ${booking.barber?.name ?? '-'}`,
      `• Jadwal: ${dateLabel}, ${timeLabel}`,
      ``,
      `Cek detail booking Anda di: ${checkUrl}`,
      `Sampai jumpa di barbershop!`,
    ].join('\n');
    return buildWhatsappUrl(booking.guest_phone, msg);
  }

  if (booking.status === 'cancelled') {
    const cancelReason =
      logs.find((l) => l.to_status === 'cancelled')?.note ??
      'Jadwal tidak dapat diproses';
    const msg = [
      `Halo ${booking.guest_name},`,
      `Mohon maaf, booking Anda (${booking.booking_code}) di SETARA Barbershop pada ${dateLabel} pukul ${timeLabel} *DIBATALKAN*.`,
      `Alasan: ${cancelReason}`,
      ``,
      `Silakan lakukan pemesanan ulang melalui website jika ingin memilih jadwal lain.`,
    ].join('\n');
    return buildWhatsappUrl(booking.guest_phone, msg);
  }

  return buildWhatsappUrl(
    booking.guest_phone,
    `Halo ${booking.guest_name}, terkait booking ${booking.booking_code} di SETARA Barbershop.`
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBarber, setFilterBarber] = useState('all');
  const [filterCode, setFilterCode] = useState('');

  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithRelations | null>(null);
  const [logs, setLogs] = useState<BookingStatusLog[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [actionNote, setActionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterBarber !== 'all') params.set('barberId', filterBarber);
      if (filterCode.trim()) params.set('code', filterCode.trim());

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, filterBarber, filterCode]);

  useEffect(() => {
    fetch('/api/admin/barbers', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setBarbers(d.barbers ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setActionError(null);
    setActionNote('');
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedBooking(data.booking);
        setLogs(data.logs ?? []);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleStatusChange(newStatus: BookingStatus) {
    if (!selectedBooking) return;
    setActionError(null);

    if (newStatus === 'cancelled' && !actionNote.trim()) {
      setActionError('Alasan pembatalan wajib diisi.');
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note: actionNote }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error ?? 'Gagal memperbarui status.');
        return;
      }
      await openDetail(selectedBooking.id);
      await fetchBookings();
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Booking</h1>
        <p className="text-sm text-brand-subtle">
          Konfirmasi, selesaikan, atau batalkan booking masuk. Setiap perubahan tercatat di log audit.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-brand-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-brand-border text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-brand-border text-sm bg-white"
        >
          <option value="all">Semua Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={filterBarber}
          onChange={(e) => setFilterBarber(e.target.value)}
          className="px-3 py-2 rounded-lg border border-brand-border text-sm bg-white"
        >
          <option value="all">Semua Barber</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterCode}
          onChange={(e) => setFilterCode(e.target.value)}
          placeholder="Cari kode (STR-...)"
          className="px-3 py-2 rounded-lg border border-brand-border text-sm font-mono uppercase"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-brand-subtle">
            Memuat data booking...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-brand-subtle">
            Tidak ada booking yang cocok dengan filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-brand-muted text-xs text-brand-subtle uppercase">
                <tr>
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">Pemesan</th>
                  <th className="px-4 py-3">Layanan & Barber</th>
                  <th className="px-4 py-3">Jadwal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      {b.booking_code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.guest_name}</p>
                      <p className="text-xs text-brand-subtle">{b.guest_phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{b.service?.name ?? '-'}</p>
                      <p className="text-xs text-brand-subtle">
                        {b.barber?.name ?? '-'} • {formatRupiah(b.price_snapshot)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{b.booking_date}</p>
                      <p className="text-xs text-brand-subtle">
                        {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)} WIB
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(b.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-brand-border text-xs font-medium hover:bg-brand-muted"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail & Status Action Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-brand-border pb-4">
              <div>
                <p className="text-xs text-brand-subtle uppercase font-medium">
                  Detail Booking
                </p>
                <h2 className="text-xl font-mono font-bold">
                  {selectedBooking.booking_code}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-lg border border-brand-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-brand-subtle">Nama</dt>
                    <dd className="font-medium">{selectedBooking.guest_name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-subtle">WhatsApp</dt>
                    <dd className="font-medium flex items-center gap-2">
                      {selectedBooking.guest_phone}
                      <a
                        href={buildWhatsappUrl(
                          selectedBooking.guest_phone,
                          `Halo ${selectedBooking.guest_name}, terkait booking ${selectedBooking.booking_code} di SETARA Barbershop.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs underline"
                      >
                        <Phone className="w-3 h-3" /> Chat
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-subtle">Layanan</dt>
                    <dd className="font-medium">
                      {selectedBooking.service?.name ?? '-'} (
                      {formatRupiah(selectedBooking.price_snapshot)})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-subtle">Barber</dt>
                    <dd className="font-medium">
                      {selectedBooking.barber?.name ?? '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-subtle">Jadwal</dt>
                    <dd className="font-medium">
                      {formatIndonesianDate(selectedBooking.booking_date)},{' '}
                      {selectedBooking.start_time.slice(0, 5)} WIB
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-brand-subtle">Status Saat Ini</dt>
                    <dd className="pt-0.5">
                      <StatusBadge status={selectedBooking.status} />
                    </dd>
                  </div>
                  {selectedBooking.notes && (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-brand-subtle">Catatan Pemesan</dt>
                      <dd className="font-medium">{selectedBooking.notes}</dd>
                    </div>
                  )}
                </dl>

                {/* 1-Klik Kabari Pelanggan via WhatsApp */}
                {(selectedBooking.status === 'confirmed' ||
                  selectedBooking.status === 'cancelled') && (
                  <div
                    className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                      selectedBooking.status === 'confirmed'
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <p className="text-xs font-medium text-brand-charcoal">
                      {selectedBooking.status === 'confirmed'
                        ? 'Booking sudah terkonfirmasi. Klik tombol untuk mengirim pesan konfirmasi otomatis ke WA pelanggan:'
                        : 'Booking dibatalkan. Klik tombol untuk mengabari pelanggan via WhatsApp:'}
                    </p>
                    <a
                      href={buildCustomerStatusWaUrl(selectedBooking, logs)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-charcoal text-white text-xs font-medium hover:opacity-90"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {selectedBooking.status === 'confirmed'
                        ? 'Kirim Konfirmasi ke WA Pelanggan'
                        : 'Kabari Pembatalan via WA'}
                    </a>
                  </div>
                )}

                {/* Status Actions */}
                {(selectedBooking.status === 'pending' ||
                  selectedBooking.status === 'confirmed') && (
                  <div className="p-4 rounded-xl bg-brand-muted space-y-3">
                    <label className="block text-xs font-medium text-brand-subtle">
                      Catatan / Alasan Perubahan Status (wajib jika membatalkan)
                    </label>
                    <input
                      type="text"
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder="Contoh: Dikonfirmasi admin / Pelanggan reschedule"
                      className="w-full px-3 py-2 rounded-lg border border-brand-border bg-white text-sm"
                    />
                    {actionError && (
                      <p className="text-xs text-red-600">{actionError}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedBooking.status === 'pending' && (
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange('confirmed')}
                          className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                        >
                          Konfirmasi Booking
                        </button>
                      )}
                      {selectedBooking.status === 'confirmed' && (
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleStatusChange('done')}
                          className="px-4 py-2 rounded-lg bg-brand-charcoal text-white text-xs font-medium disabled:opacity-50"
                        >
                          Tandai Selesai (DONE)
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleStatusChange('cancelled')}
                        className="px-4 py-2 rounded-lg border border-red-300 bg-white text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        Batalkan Booking
                      </button>
                    </div>
                  </div>
                )}

                {/* Audit Trail */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-subtle">
                    Riwayat Status (Audit Log)
                  </h3>
                  <div className="border border-brand-border rounded-lg divide-y divide-brand-border text-xs">
                    {logs.length === 0 ? (
                      <p className="p-3 text-brand-subtle">Belum ada log.</p>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="p-3 flex justify-between gap-4">
                          <div>
                            <p className="font-medium">
                              {log.from_status ? `${log.from_status} → ` : ''}
                              {log.to_status}{' '}
                              <span className="text-brand-subtle font-normal">
                                ({log.actor_type})
                              </span>
                            </p>
                            {log.note && (
                              <p className="text-brand-subtle">{log.note}</p>
                            )}
                          </div>
                          <span className="text-brand-subtle whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

