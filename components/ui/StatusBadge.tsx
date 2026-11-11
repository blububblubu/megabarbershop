import type { BookingStatus } from '@/types';
import { cn } from '@/lib/utils/format';

const STATUS_MAP: Record<BookingStatus, { label: string; classes: string }> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    classes: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  confirmed: {
    label: 'Terkonfirmasi',
    classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  done: {
    label: 'Selesai',
    classes: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  },
  cancelled: {
    label: 'Dibatalkan',
    classes: 'bg-red-50 text-red-700 border-red-200',
  },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        cfg.classes
      )}
    >
      {cfg.label}
    </span>
  );
}

