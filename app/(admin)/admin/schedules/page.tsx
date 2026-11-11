'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import type { Barber, BarberSchedule } from '@/types';
import { DAY_NAMES_ID } from '@/lib/utils/format';

interface EditableDaySchedule {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
}

function buildDefaultWeek(): EditableDaySchedule[] {
  return DAY_NAMES_ID.map((_, idx) => ({
    day_of_week: idx,
    is_working: idx !== 0,
    start_time: idx === 4 ? '13:00' : '11:00',
    end_time: '21:00',
    break_start: '',
    break_end: '',
  }));
}

export default function AdminSchedulesPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [week, setWeek] = useState<EditableDaySchedule[]>(buildDefaultWeek());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/barbers', { cache: 'no-store' });
        const data = await res.json();
        const list = (data.barbers ?? []) as Barber[];
        setBarbers(list);
        if (list[0]) {
          setSelectedBarberId(list[0].id);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBarberId) return;
    (async () => {
      setMsg(null);
      setError(null);
      const res = await fetch(
        `/api/admin/schedules?barberId=${encodeURIComponent(selectedBarberId)}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      const rows = (data.schedules ?? []) as BarberSchedule[];
      const defaults = buildDefaultWeek();
      const merged = defaults.map((def) => {
        const found = rows.find((r) => r.day_of_week === def.day_of_week);
        if (!found) return def;
        return {
          day_of_week: found.day_of_week,
          is_working: found.is_working,
          start_time: found.start_time.slice(0, 5),
          end_time: found.end_time.slice(0, 5),
          break_start: found.break_start ? found.break_start.slice(0, 5) : '',
          break_end: found.break_end ? found.break_end.slice(0, 5) : '',
        };
      });
      setWeek(merged);
    })();
  }, [selectedBarberId]);

  function updateDay(index: number, patch: Partial<EditableDaySchedule>) {
    setWeek((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBarberId) return;
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarberId,
          schedules: week.map((d) => ({
            day_of_week: d.day_of_week,
            is_working: d.is_working,
            start_time: d.start_time,
            end_time: d.end_time,
            break_start: d.break_start || null,
            break_end: d.break_end || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal menyimpan jadwal.');
        return;
      }
      setMsg('Jadwal barber berhasil disimpan.');
    } catch {
      setError('Gagal terhubung ke server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Manajemen Jadwal Barber
        </h1>
        <p className="text-sm text-brand-subtle">
          Atur jam kerja per barber (Senin–Minggu), hari libur, dan jam istirahat opsional. Hari tutup toko di Settings meng-override jadwal barber.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-brand-subtle">Memuat...</p>
      ) : barbers.length === 0 ? (
        <div className="bg-white border border-brand-border rounded-xl p-6 text-sm text-brand-subtle">
          Tambahkan barber terlebih dahulu sebelum mengatur jadwal.
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white border border-brand-border rounded-xl p-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Pilih Barber:</label>
            <select
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="px-3 py-2 rounded-lg border border-brand-border text-sm bg-white"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-brand-border rounded-xl overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-brand-muted text-xs text-brand-subtle uppercase">
                <tr>
                  <th className="px-4 py-3">Hari</th>
                  <th className="px-4 py-3">Masuk</th>
                  <th className="px-4 py-3">Jam Mulai</th>
                  <th className="px-4 py-3">Jam Selesai</th>
                  <th className="px-4 py-3">Istirahat Mulai</th>
                  <th className="px-4 py-3">Istirahat Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {week.map((day, idx) => (
                  <tr key={day.day_of_week}>
                    <td className="px-4 py-3 font-medium">
                      {DAY_NAMES_ID[day.day_of_week]}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={day.is_working}
                        onChange={(e) =>
                          updateDay(idx, { is_working: e.target.checked })
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={day.start_time}
                        disabled={!day.is_working}
                        onChange={(e) =>
                          updateDay(idx, { start_time: e.target.value })
                        }
                        className="px-2 py-1 rounded border border-brand-border text-xs disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={day.end_time}
                        disabled={!day.is_working}
                        onChange={(e) =>
                          updateDay(idx, { end_time: e.target.value })
                        }
                        className="px-2 py-1 rounded border border-brand-border text-xs disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={day.break_start}
                        disabled={!day.is_working}
                        onChange={(e) =>
                          updateDay(idx, { break_start: e.target.value })
                        }
                        className="px-2 py-1 rounded border border-brand-border text-xs disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={day.break_end}
                        disabled={!day.is_working}
                        onChange={(e) =>
                          updateDay(idx, { break_end: e.target.value })
                        }
                        className="px-2 py-1 rounded border border-brand-border text-xs disabled:opacity-40"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
            Simpan Jadwal Barber
          </button>
        </form>
      )}
    </div>
  );
}

