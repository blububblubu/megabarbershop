'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Upload, User } from 'lucide-react';
import type { Barber } from '@/types';

export default function AdminBarbersPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchBarbers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/barbers', { cache: 'no-store' });
      const data = await res.json();
      setBarbers(data.barbers ?? []);
    } catch {
      setError('Gagal memuat data barber.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBarbers();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName('');
    setBio('');
    setPhotoUrl('');
    setIsActive(true);
  }

  function startEdit(b: Barber) {
    setEditingId(b.id);
    setName(b.name);
    setBio(b.bio);
    setPhotoUrl(b.photo_url ?? '');
    setIsActive(b.is_active);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'barbers');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal upload foto.');
        return;
      }
      setPhotoUrl(data.url);
    } catch {
      setError('Gagal upload foto.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        editingId ? `/api/admin/barbers/${editingId}` : '/api/admin/barbers',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            bio,
            photo_url: photoUrl || null,
            is_active: isActive,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal menyimpan data barber.');
        return;
      }
      resetForm();
      await fetchBarbers();
    } catch {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus barber ini?')) return;
    setError(null);
    const res = await fetch(`/api/admin/barbers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Gagal menghapus barber.');
      return;
    }
    await fetchBarbers();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Barber</h1>
        <p className="text-sm text-brand-subtle">
          Kelola profil barber, foto (JPG/PNG maks 2MB), dan status aktif.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-brand-border rounded-xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-base">
          {editingId ? 'Edit Barber' : 'Tambah Barber Baru'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Nama Barber *
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
              Foto Barber (Opsional)
            </label>
            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border text-xs font-medium cursor-pointer hover:bg-brand-muted">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Mengunggah...' : 'Upload JPG/PNG'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="atau tempel URL foto"
                className="flex-1 px-3 py-2 rounded-lg border border-brand-border text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-brand-subtle mb-1">
            Bio Singkat
          </label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
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
            disabled={saving || uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-charcoal text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {editingId ? 'Simpan Perubahan' : 'Tambah Barber'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-8 text-sm text-brand-subtle">Memuat barber...</div>
        ) : (
          barbers.map((b) => (
            <div
              key={b.id}
              className="bg-white border border-brand-border rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-brand-muted border border-brand-border overflow-hidden flex items-center justify-center shrink-0">
                  {b.photo_url ? (
                    <img
                      src={b.photo_url}
                      alt={b.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-brand-subtle" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {b.name}{' '}
                    <span className="text-xs font-normal text-brand-subtle">
                      ({b.is_active ? 'Aktif' : 'Nonaktif'})
                    </span>
                  </p>
                  <p className="text-xs text-brand-subtle line-clamp-1">{b.bio}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => startEdit(b)}
                  className="px-2.5 py-1 rounded border border-brand-border text-xs hover:bg-brand-muted"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 rounded border border-red-200 text-red-700 hover:bg-red-50"
                  aria-label="Hapus barber"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

