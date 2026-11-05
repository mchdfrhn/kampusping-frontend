import { apiClient, toQueryString } from '@/core/http/api-client';

import type { ReportFormat, ReportOptions, ReportPreset, ReportPreview } from '../types';

export const reportsService = {
  options: (signal?: AbortSignal) => apiClient.get<ReportOptions>('/reports/options', { signal }),
  /** `semester` is only meaningful (and required) for the `semester` preset. */
  preview: (preset: ReportPreset, semester?: string, signal?: AbortSignal) =>
    apiClient.get<ReportPreview>(`/reports/billing${toQueryString({ preset, semester })}`, {
      signal,
    }),
  /** Resolves with the file and the name the server gave it. */
  download: (preset: ReportPreset, semester: string | undefined, format: ReportFormat) =>
    apiClient.download(`/reports/billing/export${toQueryString({ preset, semester, format })}`),
};
