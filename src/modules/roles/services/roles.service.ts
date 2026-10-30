import { apiClient, toQueryString } from '@/core/http/api-client';
import type { ListQuery, Page } from '@/core/types/common.type';

import type { Permission, Role, RoleUpsertPayload } from '../types';

export const rolesService = {
  list: (query: ListQuery) => apiClient.get<Page<Role>>(`/roles${toQueryString(query)}`),
  create: (payload: RoleUpsertPayload) => apiClient.post<Role>('/roles', payload),
  update: (id: number, payload: RoleUpsertPayload) => apiClient.put<Role>(`/roles/${id}`, payload),
  remove: (id: number) => apiClient.delete(`/roles/${id}`),
  permissions: () => apiClient.get<Permission[]>('/permissions'),
};
