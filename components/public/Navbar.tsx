'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Scissors, X } from 'lucide-react';
import { cn } from '@/lib/utils/format';

const NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/services', label: 'Layanan' },
  { href: '/gallery', label: 'Galeri' },
  { href: '/about', label: 'Tentang' },
  { href: '/contact', label: 'Kontak' },
  { href: '/check-booking', label: 'Cek Booking' },
];

export function Navbar({
  businessName,
  logoUrl,
}: {
  businessName: string;
  logoUrl?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-brand-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold text-brand-charcoal tracking-tight"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="w-8 h-8 rounded-md object-cover border border-brand-border shrink-0"
            />
          ) : (
            <Scissors className="w-5 h-5 shrink-0" />
          )}
          <span className="truncate max-w-[180px] sm:max-w-none">{businessName}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-5">
          {NAV_LINKS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm transition-colors',
                  active
                    ? 'font-semibold text-brand-charcoal'
                    : 'text-brand-subtle hover:text-brand-charcoal'
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/booking"
            className="px-4 py-2 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
          >
            Booking Sekarang
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          className="md:hidden p-2 rounded-lg border border-brand-border text-brand-charcoal"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-brand-border bg-white px-4 py-3 space-y-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'block px-3 py-2 rounded-lg text-sm',
                pathname === item.href
                  ? 'bg-brand-muted font-semibold text-brand-charcoal'
                  : 'text-brand-subtle hover:bg-brand-muted'
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/booking"
            onClick={() => setOpen(false)}
            className="block w-full text-center mt-2 px-4 py-2.5 rounded-lg bg-brand-charcoal text-white text-sm font-medium"
          >
            Booking Sekarang
          </Link>
        </div>
      )}
    </header>
  );
}
