import { ExternalLink, MapPin, Navigation, Phone } from 'lucide-react';
import { getBusinessSettings } from '@/lib/services/settings-service';
import {
  DAY_NAMES_ID,
  buildGoogleMapsDirectionsUrl,
  buildWhatsappUrl,
} from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const settings = await getBusinessSettings();
  const mapsSearchUrl =
    settings.googleMapsLink ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      settings.address
    )}`;
  const directionsUrl = buildGoogleMapsDirectionsUrl(
    settings.googleMapsLink,
    settings.address
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Lokasi & Kontak</h1>
        <p className="text-sm text-brand-subtle">
          Kunjungi {settings.businessName} atau hubungi admin via WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-brand-border rounded-xl p-6 space-y-5">
          <div className="space-y-1.5">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Alamat
            </h2>
            <p className="text-sm text-brand-subtle">{settings.address}</p>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <Phone className="w-4 h-4" /> WhatsApp Admin
            </h2>
            <p className="text-sm text-brand-subtle">+{settings.whatsappNumber}</p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={buildWhatsappUrl(
                settings.whatsappNumber,
                `Halo admin ${settings.businessName}, saya ingin bertanya mengenai booking.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
            >
              <Phone className="w-4 h-4" />
              Hubungi WhatsApp
            </a>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium hover:bg-brand-muted"
            >
              <ExternalLink className="w-4 h-4" />
              Buka di Google Maps
            </a>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium hover:bg-brand-muted"
            >
              <Navigation className="w-4 h-4" />
              Petunjuk Arah
            </a>
          </div>
        </div>

        <div className="bg-white border border-brand-border rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-base">Jam Operasional (WIB)</h2>
          <ul className="space-y-2 text-sm">
            {DAY_NAMES_ID.map((dayName, idx) => {
              const isClosed = settings.closedDays.includes(idx);
              const hrs = settings.operatingHours[String(idx)];
              return (
                <li
                  key={dayName}
                  className="flex justify-between py-1 border-b border-brand-border/60 last:border-none"
                >
                  <span className="font-medium">{dayName}</span>
                  <span className="text-brand-subtle">
                    {isClosed || !hrs ? 'Tutup' : `${hrs.open} – ${hrs.close}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="bg-white border border-brand-border rounded-xl overflow-hidden">
        {settings.googleMapsEmbedUrl ? (
          <iframe
            src={settings.googleMapsEmbedUrl}
            title="Lokasi SETARA Barbershop"
            className="w-full h-80 border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="h-56 flex items-center justify-center p-6 text-center text-sm text-brand-subtle bg-brand-muted">
            Google Maps Embed URL belum diisi. Admin dapat mengaturnya melalui menu Settings.
          </div>
        )}
      </div>
    </div>
  );
}
