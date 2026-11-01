import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { ScheduleRulePayload, ScheduleRuleRecord } from '../types';

export const schedulesService = {
  list: (query: ListQuery) =>
    apiClient.get<Page<ScheduleRuleRecord>>(`/schedule-rules${toQueryString(query)}`),
  /** Two rules cannot share an offset (409), even when one of them is inactive. */
  create: (payload: ScheduleRulePayload) =>
    apiClient.post<ScheduleRuleRecord>('/schedule-rules', payload),
  update: (id: number, payload: ScheduleRulePayload) =>
    apiClient.put<ScheduleRuleRecord>(`/schedule-rules/${id}`, payload),
  remove: (id: number) => apiClient.delete(`/schedule-rules/${id}`),
};
