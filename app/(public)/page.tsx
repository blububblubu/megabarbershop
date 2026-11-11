import Link from 'next/link';
import {
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Scissors,
  User,
} from 'lucide-react';
import { getBusinessSettings } from '@/lib/services/settings-service';
import {
  getActiveBarbers,
  getActiveServices,
  getGalleries,
} from '@/lib/services/catalog-service';
import {
  DAY_NAMES_ID,
  buildGoogleMapsDirectionsUrl,
  buildWhatsappUrl,
  formatRupiah,
} from '@/lib/utils/format';
import { GalleryGrid } from '@/components/public/GalleryGrid';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [settings, services, barbers, galleries] = await Promise.all([
    getBusinessSettings(),
    getActiveServices(),
    getActiveBarbers(),
    getGalleries(),
  ]);

  return (
    <div className="space-y-16 pb-8">
      {/* Hero Section */}
      <section className="bg-white border-b border-brand-border">
        <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-muted text-xs font-medium text-brand-subtle">
            <Clock className="w-3.5 h-3.5" />
            Booking Slot Online • Tanpa Antre Lama
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-brand-charcoal max-w-3xl">
            {settings.businessName}
          </h1>
          <p className="text-base sm:text-lg text-brand-subtle max-w-2xl">
            {settings.tagline}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
            >
              <Calendar className="w-4 h-4" />
              Booking Sekarang
            </Link>
            <Link
              href="/check-booking"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-brand-border bg-white text-brand-charcoal text-sm font-medium hover:bg-brand-muted"
            >
              Cek Status Booking
            </Link>
          </div>
        </div>
      </section>

      {/* Daftar Layanan */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Layanan Kami</h2>
            <p className="text-sm text-brand-subtle">
              Pilih layanan yang tersedia dan tentukan jadwal Anda.
            </p>
          </div>
          <Link
            href="/services"
            className="text-sm font-medium text-brand-charcoal underline underline-offset-4"
          >
            Lihat Semua
          </Link>
        </div>

        {services.length === 0 ? (
          <div className="bg-white border border-dashed border-brand-border rounded-xl p-8 text-center text-sm text-brand-subtle">
            Belum ada layanan aktif. Admin dapat menambahkan layanan via dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white border border-brand-border rounded-xl p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-brand-subtle shrink-0" />
                      {service.name}
                    </h3>
                    <span className="text-sm font-semibold whitespace-nowrap">
                      {formatRupiah(service.price)}
                    </span>
                  </div>
                  <p className="text-sm text-brand-subtle">
                    {service.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-brand-border">
                  <span className="text-xs text-brand-subtle">
                    Slot {settings.slotDurationMinutes} menit
                  </span>
                  <Link
                    href={`/booking/${service.id}`}
                    className="px-3.5 py-2 rounded-lg bg-brand-charcoal text-white text-xs font-medium hover:opacity-90"
                  >
                    Booking
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Profil Singkat Barber */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Barber Kami</h2>
          <p className="text-sm text-brand-subtle">
            Pilih barber favorit Anda saat melakukan booking.
          </p>
        </div>

        {barbers.length === 0 ? (
          <div className="bg-white border border-dashed border-brand-border rounded-xl p-8 text-center text-sm text-brand-subtle">
            Belum ada data barber aktif.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="bg-white border border-brand-border rounded-xl p-5 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-brand-muted border border-brand-border overflow-hidden flex items-center justify-center shrink-0">
                  {barber.photo_url ? (
                    <img
                      src={barber.photo_url}
                      alt={barber.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-brand-subtle" />
                  )}
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-semibold text-base truncate">
                    {barber.name}
                  </h3>
                  <p className="text-sm text-brand-subtle line-clamp-2">
                    {barber.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Galeri Preview */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Galeri</h2>
            <p className="text-sm text-brand-subtle">
              Suasana tempat dan hasil potongan SETARA Barbershop.
            </p>
          </div>
          <Link
            href="/gallery"
            className="text-sm font-medium text-brand-charcoal underline underline-offset-4"
          >
            Lihat Galeri
          </Link>
        </div>
        <GalleryGrid items={galleries.slice(0, 6)} />
      </section>

      {/* Jam Operasional & Lokasi Singkat */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-white border border-brand-border rounded-xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h2 className="text-xl font-bold">Jam Operasional (WIB)</h2>
            <ul className="space-y-1.5 text-sm">
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

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Lokasi & Kontak</h2>
            <p className="text-sm text-brand-subtle flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{settings.address}</span>
            </p>
            <div className="flex flex-wrap gap-2.5 pt-1">
              <a
                href={buildWhatsappUrl(settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
              >
                <Phone className="w-4 h-4" />
                Chat WhatsApp
              </a>
              <a
                href={
                  settings.googleMapsLink ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    settings.address
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium hover:bg-brand-muted"
              >
                <ExternalLink className="w-4 h-4" />
                Buka di Maps
              </a>
              <a
                href={buildGoogleMapsDirectionsUrl(
                  settings.googleMapsLink,
                  settings.address
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium hover:bg-brand-muted"
              >
                <Navigation className="w-4 h-4" />
                Petunjuk Arah
              </a>
            </div>
            {settings.googleMapsEmbedUrl && (
              <div className="mt-3 border border-brand-border rounded-xl overflow-hidden bg-brand-muted">
                <iframe
                  src={settings.googleMapsEmbedUrl}
                  title="Peta Lokasi SETARA Barbershop"
                  className="w-full h-56 border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
