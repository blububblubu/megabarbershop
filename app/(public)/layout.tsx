import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { getBusinessSettings } from '@/lib/services/settings-service';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getBusinessSettings();

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-charcoal">
      <Navbar businessName={settings.businessName} logoUrl={settings.logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
