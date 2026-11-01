import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { StudentFilters, StudentRecord } from '../types';

export const studentsService = {
  list: (query: ListQuery & StudentFilters) =>
    apiClient.get<Page<StudentRecord>>(`/students${toQueryString(query)}`),
  /** An empty string clears the number; an unusable number is rejected with a 422. */
  updatePhone: (id: number, phone: string) =>
    apiClient.patch<StudentRecord>(`/students/${id}`, { phone }),
};
