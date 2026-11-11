'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import type { GalleryItem } from '@/types';
import { isVideoUrl } from '@/lib/utils/format';

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function fetchGallery() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/gallery', { cache: 'no-store' });
      const data = await res.json();
      setItems(data.galleries ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGallery();
  }, []);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'gallery');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal upload media.');
        return;
      }
      setImageUrl(data.url);
    } catch {
      setError('Gagal upload media.');
    } finally {
      setUploading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          image_url: imageUrl,
          sort_order: Number.parseInt(sortOrder, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Gagal menambah foto galeri.');
        return;
      }
      setTitle('');
      setImageUrl('');
      setSortOrder('0');
      await fetchGallery();
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateOrder(id: string, newOrder: number, newTitle: string | null) {
    await fetch(`/api/admin/gallery/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sort_order: newOrder, title: newTitle }),
    });
    await fetchGallery();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus item ini dari galeri?')) return;
    await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    await fetchGallery();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Galeri</h1>
        <p className="text-sm text-brand-subtle">
          Upload foto atau video (JPG, PNG, WebP, MP4 maks 5MB), edit caption, dan atur urutan tampil.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white border border-brand-border rounded-xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-base">Tambah Media Galeri (Foto / Video)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Caption (Opsional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              Urutan
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-border text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-subtle mb-1">
              File / URL Media *
            </label>
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-brand-border text-xs font-medium cursor-pointer hover:bg-brand-muted">
                <Upload className="w-3.5 h-3.5" />
                {uploading ? 'Upload...' : 'Upload'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                placeholder="URL gambar / video"
                className="flex-1 px-3 py-2 rounded-lg border border-brand-border text-xs"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || uploading || !imageUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-charcoal text-white text-sm font-medium disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          Simpan Media
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-brand-subtle">Memuat galeri...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-brand-border rounded-xl overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] bg-brand-muted overflow-hidden">
                {isVideoUrl(item.image_url) ? (
                  <video
                    src={item.image_url}
                    controls
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.image_url}
                    alt={item.title ?? 'Foto galeri'}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-3 space-y-2 text-xs">
                <input
                  type="text"
                  defaultValue={item.title ?? ''}
                  onBlur={(e) =>
                    handleUpdateOrder(item.id, item.sort_order, e.target.value || null)
                  }
                  placeholder="Caption foto..."
                  className="w-full px-2.5 py-1.5 rounded border border-brand-border"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-1.5 text-brand-subtle">
                    Urutan:
                    <input
                      type="number"
                      defaultValue={item.sort_order}
                      onBlur={(e) =>
                        handleUpdateOrder(
                          item.id,
                          Number.parseInt(e.target.value, 10) || 0,
                          item.title
                        )
                      }
                      className="w-16 px-2 py-1 rounded border border-brand-border"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

