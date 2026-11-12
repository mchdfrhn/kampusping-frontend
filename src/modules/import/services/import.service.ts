import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { ImportBatch, ImportRowError, ImportSource, RollbackPreview } from '../types';

export const importService = {
  /** Upload a SIAKAD/SIPEMA export; the server parses it and stores a preview, nothing is applied. */
  preview: (file: File, source: ImportSource, semester?: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('source', source);
    const trimmed = semester?.trim();
    if (trimmed) form.append('semester', trimmed);
    return apiClient.upload<ImportBatch>('/imports', form);
  },
  apply: (id: number) => apiClient.post<ImportBatch>(`/imports/${id}/apply`),
  discard: (id: number) => apiClient.post<ImportBatch>(`/imports/${id}/discard`),
  /** Delete a non-applied (preview, discarded, or rolled-back) import from history. */
  delete: (id: number) => apiClient.delete<void>(`/imports/${id}`),
  /** Impact of rolling the import back, without changing anything (needs `imports:rollback`). */
  rollbackPreview: (id: number) =>
    apiClient.get<RollbackPreview>(`/imports/${id}/rollback-preview`),
  /** Undo an applied import (only the latest one; needs `imports:rollback`). */
  rollback: (id: number) => apiClient.post<ImportBatch>(`/imports/${id}/rollback`),
  list: (query: ListQuery) => apiClient.get<Page<ImportBatch>>(`/imports${toQueryString(query)}`),
  errors: (id: number, query: ListQuery) =>
    apiClient.get<Page<ImportRowError>>(`/imports/${id}/errors${toQueryString(query)}`),
};
