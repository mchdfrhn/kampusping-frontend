import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { AuditEventRecord, AuditFilters } from '../types';

export const auditService = {
  /** Sorting is limited to `at`; the server answers 422 for any other column. */
  list: (query: ListQuery & AuditFilters) =>
    apiClient.get<Page<AuditEventRecord>>(`/audit-events${toQueryString(query)}`),
};
