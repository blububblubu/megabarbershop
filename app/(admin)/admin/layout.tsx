import { redirect } from 'next/navigation';
import { requireAdminUser } from '@/lib/supabase/admin';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdminUser();
  if (!auth) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-brand-bg text-brand-charcoal">
      <AdminSidebar adminEmail={auth.adminRecord.email} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

