'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Loader2, Scissors, User } from 'lucide-react';
import type { Barber, Service, TimeSlotOption } from '@/types';
import {
  cn,
  formatIndonesianDate,
  formatRupiah,
} from '@/lib/utils/format';

interface BookingSlotFormProps {
  service: Service;
  barbers: Barber[];
  initialBarberId?: string;
  minDateStr: string;
  maxDateStr: string;
  slotDurationMinutes: number;
}

export function BookingSlotForm({
  service,
  barbers,
  initialBarberId,
  minDateStr,
  maxDateStr,
  slotDurationMinutes,
}: BookingSlotFormProps) {
  const router = useRouter();

  const [barberId, setBarberId] = useState<string>(
    initialBarberId && barbers.some((b) => b.id === initialBarberId)
      ? initialBarberId
      : barbers[0]?.id ?? ''
  );
  const [bookingDate, setBookingDate] = useState<string>(minDateStr);
  const [slots, setSlots] = useState<TimeSlotOption[]>([]);
  const [isClosedReason, setIsClosedReason] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadAvailability(targetBarberId: string, targetDate: string) {
    if (!targetBarberId || !targetDate) return;
    setLoadingSlots(true);
    setSelectedTime('');
    setIsClosedReason(null);
    try {
      const res = await fetch(
        `/api/availability?barberId=${encodeURIComponent(
          targetBarberId
        )}&date=${encodeURIComponent(targetDate)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) {
        setSlots([]);
        setIsClosedReason(data.error ?? 'Gagal memuat slot.');
      } else {
        setSlots(data.slots ?? []);
        setIsClosedReason(data.isClosed ? data.reason ?? 'Tutup' : null);
      }
    } catch {
      setSlots([]);
      setIsClosedReason('Gagal terhubung ke server.');
    } finally {
      setLoadingSlots(false);
    }
  }

  useEffect(() => {
    loadAvailability(barberId, bookingDate);
  }, [barberId, bookingDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!barberId || !bookingDate || !selectedTime) {
      setErrorMsg('Silakan pilih barber, tanggal, dan slot waktu terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          barberId,
          bookingDate,
          startTime: selectedTime,
          guestName,
          guestPhone,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Booking gagal dibuat.');
        if (res.status === 409) {
          await loadAvailability(barberId, bookingDate);
        }
        return;
      }

      router.push(
        `/booking/confirmation?code=${encodeURIComponent(
          data.booking.booking_code
        )}`
      );
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Ringkasan Layanan Terpilih */}
      <div className="bg-white border border-brand-border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-brand-subtle uppercase tracking-wider font-medium">
            Layanan Dipilih
          </p>
          <p className="font-semibold text-base flex items-center gap-2">
            <Scissors className="w-4 h-4 text-brand-subtle" />
            {service.name}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-base">{formatRupiah(service.price)}</p>
          <p className="text-xs text-brand-subtle">
            Durasi slot {slotDurationMinutes} menit
          </p>
        </div>
      </div>

      {/* Step 1: Pilih Barber */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <User className="w-4 h-4" /> 1. Pilih Barber
        </h2>
        {barbers.length === 0 ? (
          <p className="text-sm text-brand-subtle">
            Belum ada barber aktif tersedia.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {barbers.map((barber) => {
              const active = barber.id === barberId;
              return (
                <button
                  key={barber.id}
                  type="button"
                  onClick={() => setBarberId(barber.id)}
                  className={cn(
                    'flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors',
                    active
                      ? 'border-brand-charcoal bg-brand-muted/70'
                      : 'border-brand-border hover:border-brand-subtle'
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-brand-muted border border-brand-border overflow-hidden flex items-center justify-center shrink-0">
                    {barber.photo_url ? (
                      <img
                        src={barber.photo_url}
                        alt={barber.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-brand-subtle" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{barber.name}</p>
                    <p className="text-xs text-brand-subtle line-clamp-1">
                      {barber.bio}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Pilih Tanggal & Slot Waktu */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-5">
        <h2 className="font-semibold text-base flex items-center gap-2">
          <Calendar className="w-4 h-4" /> 2. Pilih Tanggal & Slot Waktu (WIB)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="booking-date"
              className="block text-xs font-medium text-brand-subtle mb-1.5"
            >
              Tanggal Booking (Maks H+14)
            </label>
            <input
              id="booking-date"
              type="date"
              min={minDateStr}
              max={maxDateStr}
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-brand-border bg-white text-sm"
              required
            />
          </div>
          <p className="text-sm text-brand-subtle pb-2">
            {bookingDate ? formatIndonesianDate(bookingDate) : ''}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-brand-subtle flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Slot Tersedia
          </p>

          {loadingSlots ? (
            <div className="py-8 flex items-center justify-center gap-2 text-sm text-brand-subtle">
              <Loader2 className="w-4 h-4 animate-spin" />
              Memuat slot tersedia...
            </div>
          ) : slots.length === 0 ? (
            <div className="p-6 rounded-xl bg-brand-muted border border-dashed border-brand-border text-center text-sm text-brand-subtle">
              {isClosedReason ??
                'Tidak ada slot tersedia pada tanggal ini. Silakan pilih tanggal atau barber lain.'}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {slots.map((slot) => {
                  const selected = selectedTime === slot.startTime;
                  const disabled = !slot.available;
                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={disabled}
                      onClick={() => slot.available && setSelectedTime(slot.startTime)}
                      aria-label={
                        disabled
                          ? `${slot.startTime} sudah dibooking`
                          : `Pilih slot ${slot.startTime}`
                      }
                      className={cn(
                        'py-2 px-2 rounded-lg border text-sm font-medium transition-colors',
                        disabled
                          ? 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed'
                          : selected
                          ? 'bg-brand-charcoal text-white border-brand-charcoal'
                          : 'bg-white border-brand-border hover:border-brand-charcoal'
                      )}
                    >
                      <span className={cn(disabled && 'line-through')}>
                        {slot.startTime}
                      </span>
                      {disabled && (
                        <span className="block text-[10px] font-normal">
                          Penuh
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {slots.every((s) => !s.available) && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Semua slot pada tanggal ini sudah terisi. Silakan pilih tanggal atau barber lain.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step 3: Data Pemesan */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">3. Data Pemesan</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="guest-name"
              className="block text-xs font-medium text-brand-subtle mb-1.5"
            >
              Nama Lengkap *
            </label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              required
              minLength={2}
              className="w-full px-3 py-2.5 rounded-lg border border-brand-border text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="guest-phone"
              className="block text-xs font-medium text-brand-subtle mb-1.5"
            >
              Nomor WhatsApp *
            </label>
            <input
              id="guest-phone"
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="Contoh: 081234567890"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-brand-border text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="guest-notes"
            className="block text-xs font-medium text-brand-subtle mb-1.5"
          >
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            id="guest-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Minta potongan mid fade rapi"
            className="w-full px-3 py-2.5 rounded-lg border border-brand-border text-sm"
          />
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !selectedTime || !barberId}
        className="w-full py-3.5 px-6 rounded-xl bg-brand-charcoal text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Memproses Booking...' : 'Konfirmasi Booking'}
      </button>
    </form>
  );
}

