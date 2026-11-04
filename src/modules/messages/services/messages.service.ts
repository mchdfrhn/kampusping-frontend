import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type {
  ManualFilterOptions,
  ManualMessagePreviewRequest,
  ManualMessagePreviewResponse,
  ManualMessageSendRequest,
  ManualMessageSendResponse,
  MessageFilters,
  MessageRecord,
} from '../types';

export const messagesService = {
  list: (query: ListQuery & MessageFilters) =>
    apiClient.get<Page<MessageRecord>>(`/messages${toQueryString(query)}`),
  /** Only a queued message can be cancelled; anything else is a 409 from the server. */
  cancel: (id: number) => apiClient.post<MessageRecord>(`/messages/${id}/cancel`),
  getFilterOptions: () => apiClient.get<ManualFilterOptions>('/messages/manual/options'),
  previewManual: (payload: ManualMessagePreviewRequest) =>
    apiClient.post<ManualMessagePreviewResponse>('/messages/manual/preview', payload),
  sendManual: (payload: ManualMessageSendRequest) =>
    apiClient.post<ManualMessageSendResponse>('/messages/manual/send', payload),
};
