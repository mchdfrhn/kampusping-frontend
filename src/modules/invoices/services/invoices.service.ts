import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type {
  InvoiceDeleteByFilePreview,
  InvoiceDeleteByFileResult,
  InvoiceFilterOptions,
  InvoiceFilters,
  InvoiceRecord,
  InvoiceStatus,
} from '../types';

export const invoicesService = {
  list: (query: ListQuery & InvoiceFilters) =>
    apiClient.get<Page<InvoiceRecord>>(`/invoices${toQueryString(query)}`),
  /** Distinct semesters available for filtering. */
  filterOptions: () => apiClient.get<InvoiceFilterOptions>('/invoices/filter-options'),
  /** Manual correction of a payment status; the server records it in the audit trail. */
  setStatus: (id: number, status: InvoiceStatus) =>
    apiClient.patch<InvoiceRecord>(`/invoices/${id}/status`, { status }),
  /** Upload file to preview invoice deletion. */
  previewDeleteByFile: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.upload<InvoiceDeleteByFilePreview>('/invoices/delete-by-file/preview', form);
  },
  /** Delete invoices matching uploaded file. */
  deleteByFile: (file: File, hardDelete = false) => {
    const form = new FormData();
    form.append('file', file);
    form.append('hard_delete', String(hardDelete));
    return apiClient.upload<InvoiceDeleteByFileResult>('/invoices/delete-by-file', form);
  },
  /** Delete invoices by specific confirmed invoice codes. */
  deleteByCodes: (codes: string[], hardDelete = false) =>
    apiClient.post<InvoiceDeleteByFileResult>('/invoices/delete-by-codes', {
      invoice_codes: codes,
      hard_delete: hardDelete,
    }),
};
