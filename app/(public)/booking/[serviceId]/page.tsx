import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  getActiveBarbers,
  getActiveServices,
} from '@/lib/services/catalog-service';
import { getBusinessSettings } from '@/lib/services/settings-service';
import { addDaysToDateStr, getWibNowParts } from '@/lib/utils/format';
import { BookingSlotForm } from '@/components/booking/BookingSlotForm';

export const dynamic = 'force-dynamic';

export default async function BookingServicePage({
  params,
  searchParams,
}: {
  params: { serviceId: string };
  searchParams: { barberId?: string };
}) {
  const [services, barbers, settings] = await Promise.all([
    getActiveServices(),
    getActiveBarbers(),
    getBusinessSettings(),
  ]);

  const service = services.find((s) => s.id === params.serviceId);
  if (!service) {
    notFound();
  }

  const wibNow = getWibNowParts();
  const minDateStr = wibNow.dateStr;
  const maxDateStr = addDaysToDateStr(minDateStr, settings.bookingMaxDaysAhead);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="space-y-2">
        <Link
          href="/booking"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-subtle hover:text-brand-charcoal"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ganti Layanan
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Atur Jadwal Booking
        </h1>
      </div>

      <BookingSlotForm
        service={service}
        barbers={barbers}
        initialBarberId={searchParams.barberId}
        minDateStr={minDateStr}
        maxDateStr={maxDateStr}
        slotDurationMinutes={settings.slotDurationMinutes}
      />
    </div>
  );
}
