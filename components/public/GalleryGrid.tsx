'use client';

import { useState } from 'react';
import { Play, X } from 'lucide-react';
import type { GalleryItem } from '@/types';
import { isVideoUrl } from '@/lib/utils/format';

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-brand-border rounded-xl p-10 text-center text-sm text-brand-subtle">
        Belum ada foto galeri. Admin dapat mengunggah foto melalui Dashboard Admin.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const isVideo = isVideoUrl(item.image_url);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item)}
              className="group text-left bg-white border border-brand-border rounded-xl overflow-hidden hover:border-brand-charcoal transition-colors"
            >
              <div className="relative aspect-[4/3] bg-brand-muted overflow-hidden">
                {isVideo ? (
                  <>
                    <video
                      src={item.image_url}
                      muted
                      playsInline
                      loop
                      autoPlay
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    />
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-medium">
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Video
                    </span>
                  </>
                ) : (
                  <img
                    src={item.image_url}
                    alt={item.title ?? 'Foto galeri SETARA Barbershop'}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                  />
                )}
              </div>
              {item.title && (
                <div className="p-3 text-sm font-medium text-brand-charcoal">
                  {item.title}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Tutup lightbox"
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-brand-charcoal shadow"
            >
              <X className="w-5 h-5" />
            </button>
            {isVideoUrl(selected.image_url) ? (
              <video
                src={selected.image_url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[75vh] bg-black"
              />
            ) : (
              <img
                src={selected.image_url}
                alt={selected.title ?? 'Foto galeri'}
                className="w-full max-h-[75vh] object-contain bg-brand-muted"
              />
            )}
            {selected.title && (
              <div className="p-4 border-t border-brand-border text-sm font-medium">
                {selected.title}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
