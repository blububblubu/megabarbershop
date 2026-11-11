'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  CalendarCheck,
  Clock,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/format';

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Booking', icon: CalendarCheck },
  { href: '/admin/services', label: 'Layanan', icon: Scissors },
  { href: '/admin/barbers', label: 'Barber', icon: Users },
  { href: '/admin/schedules', label: 'Jadwal Barber', icon: Clock },
  { href: '/admin/gallery', label: 'Galeri', icon: ImageIcon },
  { href: '/admin/settings', label: 'Konten & Settings', icon: Settings },
];

export function AdminSidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4 space-y-6">
      <div className="space-y-6">
        <div className="px-2">
          <p className="font-bold text-base tracking-tight">SETARA Admin</p>
          <p className="text-xs text-brand-subtle truncate">{adminEmail}</p>
        </div>

        <nav className="space-y-1">
          {ADMIN_LINKS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-brand-charcoal text-white font-medium'
                    : 'text-brand-ink hover:bg-brand-muted'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 pt-4 border-t border-brand-border">
        <Link
          href="/"
          className="block px-3 py-2 rounded-lg text-xs text-brand-subtle hover:bg-brand-muted"
        >
          Lihat Website Publik →
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-brand-border px-4 h-14 flex items-center justify-between">
        <span className="font-bold text-sm">SETARA Admin</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg border border-brand-border"
          aria-label="Toggle admin menu"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
          <aside
            className="w-64 h-full bg-white border-r border-brand-border"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-brand-border min-h-screen sticky top-0 h-screen">
        {navContent}
      </aside>
    </>
  );
}

