import { getGalleries } from '@/lib/services/catalog-service';
import { GalleryGrid } from '@/components/public/GalleryGrid';

export const dynamic = 'force-dynamic';

export default async function GalleryPage() {
  const galleries = await getGalleries();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Galeri</h1>
        <p className="text-sm text-brand-subtle">
          Klik foto untuk melihat tampilan penuh.
        </p>
      </div>

      <GalleryGrid items={galleries} />
    </div>
  );
}
