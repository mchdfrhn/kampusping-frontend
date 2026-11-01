import { apiClient } from '@/core/http/api-client';

import type { SettingsPayload, SettingsRecord } from '../types';

export const settingsService = {
  get: () => apiClient.get<SettingsRecord>('/settings'),
  update: (payload: SettingsPayload) => apiClient.put<SettingsRecord>('/settings', payload),
  /** Clears the pause (and the failure counter) after the circuit breaker tripped. */
  resume: () => apiClient.post<SettingsRecord>('/settings/resume'),
};
