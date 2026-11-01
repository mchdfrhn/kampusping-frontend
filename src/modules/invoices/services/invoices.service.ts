import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { InvoiceFilters, InvoiceRecord, InvoiceStatus } from '../types';

export const invoicesService = {
  list: (query: ListQuery & InvoiceFilters) =>
    apiClient.get<Page<InvoiceRecord>>(`/invoices${toQueryString(query)}`),
  /** Manual correction of a payment status; the server records it in the audit trail. */
  setStatus: (id: number, status: InvoiceStatus) =>
    apiClient.patch<InvoiceRecord>(`/invoices/${id}/status`, { status }),
};
