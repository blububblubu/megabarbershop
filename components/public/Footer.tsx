import Link from 'next/link';
import type { ParsedBusinessSettings } from '@/lib/services/settings-service';
import { DAY_NAMES_ID, buildWhatsappUrl } from '@/lib/utils/format';

export function Footer({ settings }: { settings: ParsedBusinessSettings }) {
  return (
    <footer className="bg-white border-t border-brand-border mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt={settings.businessName}
                className="w-8 h-8 rounded-md object-cover border border-brand-border shrink-0"
              />
            )}
            <p className="font-semibold text-base text-brand-charcoal">
              {settings.businessName}
            </p>
          </div>
          <p className="text-brand-subtle">{settings.tagline}</p>
          <p className="text-brand-subtle pt-1">{settings.address}</p>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-brand-charcoal">Jam Operasional (WIB)</p>
          <ul className="space-y-1 text-brand-subtle">
            {DAY_NAMES_ID.map((dayName, idx) => {
              const isClosed = settings.closedDays.includes(idx);
              const hrs = settings.operatingHours[String(idx)];
              return (
                <li key={dayName} className="flex justify-between max-w-xs">
                  <span>{dayName}</span>
                  <span>
                    {isClosed || !hrs ? 'Tutup' : `${hrs.open} – ${hrs.close}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="font-semibold text-brand-charcoal">Tautan Cepat</p>
          <div className="flex flex-col space-y-1.5 text-brand-subtle">
            <Link href="/booking" className="hover:text-brand-charcoal">
              Booking Online
            </Link>
            <Link href="/check-booking" className="hover:text-brand-charcoal">
              Cek Status Booking
            </Link>
            <Link href="/services" className="hover:text-brand-charcoal">
              Daftar Layanan
            </Link>
            <Link href="/contact" className="hover:text-brand-charcoal">
              Lokasi & Kontak
            </Link>
            <a
              href={buildWhatsappUrl(settings.whatsappNumber)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-charcoal"
            >
              WhatsApp Admin
            </a>
            <Link href="/admin" className="hover:text-brand-charcoal pt-2 text-xs">
              Login Admin
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-brand-border py-4 text-center text-xs text-brand-subtle">
        © {new Date().getFullYear()} {settings.businessName}. Semua hak dilindungi.
      </div>
    </footer>
  );
}
