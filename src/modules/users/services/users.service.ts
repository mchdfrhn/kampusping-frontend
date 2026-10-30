import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { UserCreatePayload, UserRecord, UserUpdatePayload } from '../types';

export const usersService = {
  list: (query: ListQuery) => apiClient.get<Page<UserRecord>>(`/users${toQueryString(query)}`),
  create: (payload: UserCreatePayload) => apiClient.post<UserRecord>('/users', payload),
  update: (id: number, payload: UserUpdatePayload) =>
    apiClient.put<UserRecord>(`/users/${id}`, payload),
  remove: (id: number) => apiClient.delete(`/users/${id}`),
};
