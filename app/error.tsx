'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-brand-bg">
      <div className="max-w-md w-full bg-white border border-brand-border rounded-xl p-6 text-center space-y-4">
        <h2 className="text-lg font-semibold">Terjadi Gangguan</h2>
        <p className="text-sm text-brand-subtle">
          {error.message || 'Mohon maaf, terjadi kesalahan saat memuat halaman.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-brand-charcoal text-white text-sm font-medium hover:opacity-90"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}

