'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { saveRecentBookingCode } from '@/lib/utils/recent-bookings';

export function BookingConfirmationActions({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    saveRecentBookingCode(code);
  }, [code]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback jika clipboard API tidak tersedia
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-charcoal hover:bg-brand-muted transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          Tersalin
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Salin Kode
        </>
      )}
    </button>
  );
}

