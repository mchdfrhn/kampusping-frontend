import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type {
  ImportBatch,
  ImportDetailCategory,
  ImportDetailItem,
  ImportRowError,
  ImportSource,
  RollbackPreview,
} from '../types';

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
  /** `markPaidInvoiceIds` are the suspected-paid invoices staff approved; omit for none. */
  apply: (id: number, markPaidInvoiceIds?: number[]) =>
    apiClient.post<ImportBatch>(
      `/imports/${id}/apply`,
      markPaidInvoiceIds === undefined ? undefined : { mark_paid_invoice_ids: markPaidInvoiceIds },
    ),
  discard: (id: number) => apiClient.post<ImportBatch>(`/imports/${id}/discard`),
  /** Delete an import from history (applied batches require force=true). */
  delete: (id: number, force = false) =>
    apiClient.delete<void>(`/imports/${id}${force ? '?force=true' : ''}`),
  /** Impact of rolling the import back, without changing anything (needs `imports:rollback`). */
  rollbackPreview: (id: number) =>
    apiClient.get<RollbackPreview>(`/imports/${id}/rollback-preview`),
  /** Undo an applied import (only the latest one; needs `imports:rollback`). */
  rollback: (id: number) => apiClient.post<ImportBatch>(`/imports/${id}/rollback`),
  list: (query: ListQuery) => apiClient.get<Page<ImportBatch>>(`/imports${toQueryString(query)}`),
  errors: (id: number, query: ListQuery) =>
    apiClient.get<Page<ImportRowError>>(`/imports/${id}/errors${toQueryString(query)}`),
  /** The new, changed or suspected-paid invoices of a preview. */
  details: <C extends ImportDetailCategory>(id: number, category: C, query: ListQuery) =>
    apiClient.get<Page<ImportDetailItem<C>>>(
      `/imports/${id}/details${toQueryString({ ...query, category })}`,
    ),
  /** Invoice ids of every suspected-paid invoice, for "select all" across pages. */
  detailIds: (id: number) =>
    apiClient.get<{ ids: number[] }>(`/imports/${id}/details/ids?category=suspected_paid`),
};
