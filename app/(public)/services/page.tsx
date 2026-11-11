import Link from 'next/link';
import { Clock, Scissors } from 'lucide-react';
import { getActiveServices } from '@/lib/services/catalog-service';
import { getBusinessSettings } from '@/lib/services/settings-service';
import { formatRupiah } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const [services, settings] = await Promise.all([
    getActiveServices(),
    getBusinessSettings(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Daftar Layanan</h1>
        <p className="text-sm text-brand-subtle">
          Pilih layanan untuk melihat ketersediaan barber dan slot waktu.
        </p>
      </div>

      {services.length === 0 ? (
        <div className="bg-white border border-dashed border-brand-border rounded-xl p-10 text-center text-sm text-brand-subtle">
          Belum ada layanan aktif saat ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white border border-brand-border rounded-xl p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-brand-subtle shrink-0" />
                    {service.name}
                  </h2>
                  <span className="font-bold text-base whitespace-nowrap">
                    {formatRupiah(service.price)}
                  </span>
                </div>
                <p className="text-sm text-brand-subtle leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-brand-border flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs text-brand-subtle">
                  <Clock className="w-3.5 h-3.5" />
                  {settings.slotDurationMinutes} menit
                </span>
                <Link
                  href={`/booking/${service.id}`}
                  className="px-4 py-2 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
                >
                  Booking
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
