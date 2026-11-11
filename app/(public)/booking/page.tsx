import Link from 'next/link';
import { Scissors } from 'lucide-react';
import { getActiveServices } from '@/lib/services/catalog-service';
import { getBusinessSettings } from '@/lib/services/settings-service';
import { formatRupiah } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function BookingIndexPage() {
  const [services, settings] = await Promise.all([
    getActiveServices(),
    getBusinessSettings(),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-brand-subtle font-medium">
          Booking Online
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Pilih Layanan</h1>
        <p className="text-sm text-brand-subtle">
          Pilih layanan terlebih dahulu untuk memilih barber dan slot waktu tersedia.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="bg-white border border-dashed border-brand-border rounded-xl p-10 text-center text-sm text-brand-subtle">
          Belum ada layanan aktif tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/booking/${service.id}`}
              className="bg-white border border-brand-border rounded-xl p-5 hover:border-brand-charcoal transition-colors flex flex-col justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-brand-subtle" />
                    {service.name}
                  </h2>
                  <span className="font-bold text-sm">
                    {formatRupiah(service.price)}
                  </span>
                </div>
                <p className="text-sm text-brand-subtle">{service.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-brand-border text-xs">
                <span className="text-brand-subtle">
                  Slot {settings.slotDurationMinutes} menit
                </span>
                <span className="font-semibold text-brand-charcoal">
                  Pilih Barber & Slot →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
