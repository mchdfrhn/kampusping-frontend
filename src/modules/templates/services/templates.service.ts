import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { TemplateFilters, TemplatePayload, TemplatePreview, TemplateRecord } from '../types';

export const templatesService = {
  list: (query: ListQuery & TemplateFilters) =>
    apiClient.get<Page<TemplateRecord>>(`/templates${toQueryString(query)}`),
  create: (payload: TemplatePayload) => apiClient.post<TemplateRecord>('/templates', payload),
  update: (id: number, payload: TemplatePayload) =>
    apiClient.put<TemplateRecord>(`/templates/${id}`, payload),
  /** A template still used by a schedule rule is a 409 from the server. */
  remove: (id: number) => apiClient.delete(`/templates/${id}`),
  /** Renders the body with sample data; unknown variables are reported, not rejected. */
  preview: (body: string) => apiClient.post<TemplatePreview>('/templates/preview', { body }),
};
