import { apiClient } from '@/core/http/api-client';

import type { WhatsAppStatus } from '../types';

export const whatsappService = {
  status: (signal?: AbortSignal) => apiClient.get<WhatsAppStatus>('/whatsapp/status', { signal }),
  /** 502 when the gateway cannot be reached. */
  logout: () => apiClient.post<{ status: 'logged_out' }>('/whatsapp/logout'),
};
