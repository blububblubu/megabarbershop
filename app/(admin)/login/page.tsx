'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, Scissors } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');
  const redirectTo = searchParams.get('redirect') || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    urlError === 'unauthorized'
      ? 'Akun ini tidak memiliki akses admin.'
      : urlError === 'env_not_configured'
      ? 'Konfigurasi Supabase (.env.local) belum diisi.'
      : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg('Email atau password salah.');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal melakukan login.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
      <div className="max-w-md w-full bg-white border border-brand-border rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-11 h-11 rounded-full bg-brand-muted border border-brand-border mx-auto flex items-center justify-center">
            <Scissors className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Login Admin</h1>
          <p className="text-sm text-brand-subtle">
            Masuk ke dashboard pengelola SETARA Barbershop
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-medium text-brand-subtle mb-1.5"
            >
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@setarabarbershop.id"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-brand-subtle mb-1.5"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-lg border border-brand-border text-sm"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {loading ? 'Memverifikasi...' : 'Masuk Dashboard'}
          </button>
        </form>

        <div className="pt-2 border-t border-brand-border text-center">
          <Link
            href="/"
            className="text-xs text-brand-subtle hover:text-brand-charcoal"
          >
            ← Kembali ke Website Publik
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bg" />}>
      <LoginForm />
    </Suspense>
  );
}

