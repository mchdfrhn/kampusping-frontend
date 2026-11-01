import { apiClient, toQueryString } from '@/core/http/api-client';

import type { DashboardSummary } from '../types';

export const dashboardService = {
  /** `semester` undefined (or empty) means every semester. */
  summary: (semester?: string, signal?: AbortSignal) =>
    apiClient.get<DashboardSummary>(`/dashboard/summary${toQueryString({ semester })}`, {
      signal,
    }),
};
