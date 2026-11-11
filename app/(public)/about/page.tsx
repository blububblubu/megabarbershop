import Link from 'next/link';
import { getBusinessSettings } from '@/lib/services/settings-service';

export const dynamic = 'force-dynamic';

export default async function AboutPage() {
  const settings = await getBusinessSettings();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-brand-subtle font-medium">
          Tentang Kami
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {settings.businessName}
        </h1>
        <p className="text-base text-brand-subtle">{settings.tagline}</p>
      </div>

      <div className="bg-white border border-brand-border rounded-xl p-6 sm:p-8 space-y-4">
        <p className="text-sm sm:text-base leading-relaxed text-brand-ink whitespace-pre-line">
          {settings.aboutDescription}
        </p>
        <div className="pt-4 border-t border-brand-border flex flex-wrap gap-3">
          <Link
            href="/booking"
            className="px-4 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
          >
            Booking Sekarang
          </Link>
          <Link
            href="/services"
            className="px-4 py-2.5 rounded-lg border border-brand-border text-sm font-medium hover:bg-brand-muted"
          >
            Lihat Layanan
          </Link>
        </div>
      </div>
    </div>
  );
}
