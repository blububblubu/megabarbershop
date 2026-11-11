'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import {
  DEFAULT_OPERATING_HOURS,
  DEFAULT_SETTINGS,
  parseSettingsRows,
} from '@/lib/utils/settings';
import { DAY_NAMES_ID } from '@/lib/utils/format';
import type { OperatingHoursMap, SettingItem } from '@/types';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState(DEFAULT_SETTINGS.businessName);
  const [tagline, setTagline] = useState(DEFAULT_SETTINGS.tagline);
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [aboutDescription, setAboutDescription] = useState(
    DEFAULT_SETTINGS.aboutDescription
  );
  const [address, setAddress] = useState(DEFAULT_SETTINGS.address);
  const [whatsappNumber, setWhatsappNumber] = useState(
    DEFAULT_SETTINGS.whatsappNumber
  );
  const [googleMapsEmbedUrl, setGoogleMapsEmbedUrl] = useState('');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [slotDurationMinutes, setSlotDurationMinutes] = useState('40');
  const [bookingMinLeadMinutes, setBookingMinLeadMinutes] = useState('30');
  const [bookingMaxDaysAhead, setBookingMaxDaysAhead] = useState('14');
  const [maxPendingPerPhone, setMaxPendingPerPhone] = useState('2');
  const [closedDays, setClosedDays] = useState<number[]>([0]);
  const [operatingHours, setOperatingHours] = useState<OperatingHoursMap>(
    DEFAULT_OPERATING_HOURS
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' });
        const data = await res.json();
        const rows = (data.settings ?? []) as SettingItem[];
        if (rows.length > 0) {
          const parsed = parseSettingsRows(rows);
          setBusinessName(parsed.businessName);
          setTagline(parsed.tagline);
          setLogoUrl(parsed.logoUrl);
          setAboutDescription(parsed.aboutDescription);
          setAddress(parsed.address);
          setWhatsappNumber(parsed.whatsappNumber);
          setGoogleMapsEmbedUrl(parsed.googleMapsEmbedUrl);
          setGoogleMapsLink(parsed.googleMapsLink);
          setSlotDurationMinutes(String(parsed.slotDurationMinutes));
          setBookingMinLeadMinutes(String(parsed.bookingMinLeadMinutes));
          setBookingMaxDaysAhead(String(parsed.bookingMaxDaysAhead));
          setMaxPendingPerPhone(String(parsed.maxPendingPerPhone));
          setClosedDays(parsed.closedDays);
          setOperatingHours(parsed.operatingHours);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleClosedDay(dayIdx: number) {
    setClosedDays((prev) => {
      const exists = prev.includes(dayIdx);
      const next = exists ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx];
      return next.sort((a, b) => a - b);
    });
    setOperatingHours((prev) => {
      const key = String(dayIdx);
      if (prev[key] === null) {
        return {
          ...prev,
          [key]: { open: dayIdx === 4 ? '13:00' : '11:00', close: '21:00' },
        };
      }
      return { ...prev, [key]: null };
    });
  }

  function updateDayHours(
    dayIdx: number,
    field: 'open' | 'close',
    value: string
  ) {
    const key = String(dayIdx);
    setOperatingHours((prev) => {
      const current = prev[key] ?? { open: '11:00', close: '21:00' };
      return {
        ...prev,
        [key]: { ...current, [field]: value },
      };
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'logo');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal upload logo.');
        return;
      }
      setLogoUrl(data.url);
    } catch {
      setError('Gagal upload logo.');
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const items = [
        { key: 'business_name', value: businessName, type: 'string', group: 'identity' },
        { key: 'tagline', value: tagline, type: 'string', group: 'identity' },
        { key: 'logo_url', value: logoUrl, type: 'string', group: 'identity' },
        { key: 'about_description', value: aboutDescription, type: 'text', group: 'content' },
        { key: 'address', value: address, type: 'text', group: 'contact' },
        { key: 'whatsapp_number', value: whatsappNumber, type: 'string', group: 'contact' },
        { key: 'google_maps_embed_url', value: googleMapsEmbedUrl, type: 'text', group: 'contact' },
        { key: 'google_maps_link', value: googleMapsLink, type: 'text', group: 'contact' },
        { key: 'slot_duration_minutes', value: slotDurationMinutes, type: 'int', group: 'booking' },
        { key: 'booking_min_lead_minutes', value: bookingMinLeadMinutes, type: 'int', group: 'booking' },
        { key: 'booking_max_days_ahead', value: bookingMaxDaysAhead, type: 'int', group: 'booking' },
        { key: 'max_pending_per_phone', value: maxPendingPerPhone, type: 'int', group: 'booking' },
        { key: 'closed_days', value: JSON.stringify(closedDays), type: 'json', group: 'schedule' },
        { key: 'operating_hours', value: JSON.stringify(operatingHours), type: 'json', group: 'schedule' },
      ];

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal menyimpan pengaturan.');
        return;
      }
      setMsg('Pengaturan & konten website berhasil disimpan.');
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-brand-subtle">Memuat pengaturan...</p>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Konten & Pengaturan Website
        </h1>
        <p className="text-sm text-brand-subtle">
          Kelola identitas bisnis, deskripsi, kontak, jam operasional, dan aturan slot booking.
        </p>
      </div>

      {/* Identitas & Konten */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Identitas & Konten</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Nama Barbershop
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-subtle mb-1">
            Logo Barbershop (JPG / PNG / WebP maks 2MB)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Preview Logo"
                className="w-12 h-12 rounded-lg object-cover border border-brand-border"
              />
            )}
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border text-xs font-medium cursor-pointer hover:bg-brand-muted">
              <Upload className="w-3.5 h-3.5" />
              {uploadingLogo ? 'Mengunggah...' : 'Upload Logo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="atau tempel URL logo"
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-brand-border text-xs"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-subtle mb-1">
            Deskripsi Tentang Kami
          </label>
          <textarea
            rows={3}
            value={aboutDescription}
            onChange={(e) => setAboutDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
          />
        </div>
      </div>

      {/* Lokasi & Kontak */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Lokasi & Kontak</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Nomor WhatsApp Admin (contoh: 6281234567890)
            </label>
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Link Google Maps
            </label>
            <input
              type="text"
              value={googleMapsLink}
              onChange={(e) => setGoogleMapsLink(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-subtle mb-1">
            Alamat Lengkap
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-subtle mb-1">
            Google Maps Embed URL (src iframe)
          </label>
          <input
            type="text"
            value={googleMapsEmbedUrl}
            onChange={(e) => setGoogleMapsEmbedUrl(e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
          />
        </div>
      </div>

      {/* Aturan Slot Booking */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Aturan Booking (WIB)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Durasi Slot (menit)
            </label>
            <input
              type="number"
              min={10}
              value={slotDurationMinutes}
              onChange={(e) => setSlotDurationMinutes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Min Lead Time (menit)
            </label>
            <input
              type="number"
              min={0}
              value={bookingMinLeadMinutes}
              onChange={(e) => setBookingMinLeadMinutes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Maks Hari Ke Depan
            </label>
            <input
              type="number"
              min={1}
              value={bookingMaxDaysAhead}
              onChange={(e) => setBookingMaxDaysAhead(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Maks Pending / No WA
            </label>
            <input
              type="number"
              min={1}
              value={maxPendingPerPhone}
              onChange={(e) => setMaxPendingPerPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
        </div>
      </div>

      {/* Jam Operasional Toko */}
      <div className="bg-white border border-brand-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-base">Jam Operasional & Hari Tutup</h2>
        <div className="divide-y divide-brand-border text-sm">
          {DAY_NAMES_ID.map((dayName, idx) => {
            const isClosed = closedDays.includes(idx) || !operatingHours[String(idx)];
            const hrs = operatingHours[String(idx)] ?? { open: '11:00', close: '21:00' };
            return (
              <div
                key={dayName}
                className="py-2.5 flex flex-wrap items-center justify-between gap-3"
              >
                <span className="w-24 font-medium">{dayName}</span>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={isClosed}
                    onChange={() => toggleClosedDay(idx)}
                  />
                  Tutup
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={hrs.open}
                    disabled={isClosed}
                    onChange={(e) => updateDayHours(idx, 'open', e.target.value)}
                    className="px-2 py-1 rounded border border-brand-border text-xs disabled:opacity-40"
                  />
                  <span className="text-xs text-brand-subtle">s/d</span>
                  <input
                    type="time"
                    value={hrs.close}
                    disabled={isClosed}
                    onChange={(e) => updateDayHours(idx, 'close', e.target.value)}
                    className="px-2 py-1 rounded border border-brand-border text-xs disabled:opacity-40"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {error}
        </div>
      )}
      {msg && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
          {msg}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Simpan Semua Pengaturan
      </button>
    </form>
  );
}

