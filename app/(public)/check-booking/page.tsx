import { getBusinessSettings } from '@/lib/services/settings-service';
import { CheckBookingClient } from '@/components/booking/CheckBookingClient';

export const dynamic = 'force-dynamic';

export default async function CheckBookingPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const settings = await getBusinessSettings();

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cek Status Booking</h1>
        <p className="text-sm text-brand-subtle">
          Masukkan kode booking Anda untuk melihat status konfirmasi atau membatalkan booking yang masih berstatus Menunggu Konfirmasi.
        </p>
      </div>

      <CheckBookingClient
        initialCode={searchParams.code}
        whatsappNumber={settings.whatsappNumber}
        businessName={settings.businessName}
      />
    </div>
  );
}
