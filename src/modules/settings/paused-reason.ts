const PAUSED_REASON_LABELS: Record<string, string> = {
  circuit_breaker: 'terlalu banyak kegagalan beruntun',
};

/** Indonesian wording for a `paused_reason` code; unknown codes are shown as they are. */
export const describePausedReason = (reason: string): string =>
  PAUSED_REASON_LABELS[reason] ?? reason;
