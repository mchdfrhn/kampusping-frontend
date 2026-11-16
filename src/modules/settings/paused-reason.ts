import { formatDisplayDateTime } from '@/core/utils/date.util';

const PAUSED_REASON_LABELS: Record<string, string> = {
  circuit_breaker: 'terlalu banyak kegagalan beruntun',
};

/** Indonesian wording for a `paused_reason` code; unknown codes are shown as they are. */
export const describePausedReason = (reason: string): string =>
  PAUSED_REASON_LABELS[reason] ?? reason;

/** Indonesian warning copy when the worker heartbeat has gone stale or never arrived. */
export const formatWorkerOfflineMessage = (lastSeenAt?: string | null): string => {
  const lastSeen = lastSeenAt ? formatDisplayDateTime(lastSeenAt) : null;
  return lastSeen && lastSeen !== '-'
    ? `Worker pengirim pesan sedang tidak aktif (terakhir aktif ${lastSeen}). Antrean tidak akan diproses sampai container worker berjalan.`
    : 'Worker pengirim pesan sedang tidak aktif atau belum pernah berjalan. Antrean tidak akan diproses sampai container worker berjalan.';
};
