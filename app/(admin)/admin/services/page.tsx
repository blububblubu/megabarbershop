'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { Service } from '@/types';
import { formatRupiah } from '@/lib/utils/format';

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('30000');
  const [durationMinutes, setDurationMinutes] = useState('40');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchServices() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/services', { cache: 'no-store' });
      const data = await res.json();
      setServices(data.services ?? []);
    } catch {
      setError('Gagal memuat data layanan.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('30000');
    setDurationMinutes('40');
    setIsActive(true);
  }

  function startEdit(s: Service) {
    setEditingId(s.id);
    setName(s.name);
    setDescription(s.description);
    setPrice(String(s.price));
    setDurationMinutes(String(s.duration_minutes));
    setIsActive(s.is_active);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        price: Number.parseInt(price, 10),
        duration_minutes: Number.parseInt(durationMinutes, 10),
        is_active: isActive,
      };
      const res = await fetch(
        editingId ? `/api/admin/services/${editingId}` : '/api/admin/services',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal menyimpan layanan.');
        return;
      }
      resetForm();
      await fetchServices();
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus layanan ini?')) return;
    setError(null);
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Gagal menghapus layanan.');
      return;
    }
    await fetchServices();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Layanan</h1>
        <p className="text-sm text-brand-subtle">
          Kelola layanan, harga (IDR), dan status aktif/nonaktif.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-brand-border rounded-xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-base">
          {editingId ? 'Edit Layanan' : 'Tambah Layanan Baru'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Nama Layanan *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Harga (Rp) *
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Durasi Referensi (Menit)
            </label>
            <input
              type="number"
              min={10}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-subtle mb-1">
            Deskripsi
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          Aktif (tampil di halaman publik & bisa dibooking)
        </label>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-charcoal text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editingId ? 'Simpan Perubahan' : 'Tambah Layanan'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-brand-border text-sm"
            >
              Batal Edit
            </button>
          )}
        </div>
      </form>

      <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-brand-subtle">
            Memuat layanan...
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center text-sm text-brand-subtle">
            Belum ada layanan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-brand-muted text-xs text-brand-subtle uppercase">
                <tr>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Harga</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {services.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-brand-subtle line-clamp-1">
                        {s.description}
                      </p>
                    </td>
                    <td className="px-4 py-3">{formatRupiah(s.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs border ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {s.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => startEdit(s)}
                        className="px-2.5 py-1 rounded border border-brand-border text-xs hover:bg-brand-muted"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-red-700 text-xs hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
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

