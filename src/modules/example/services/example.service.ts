import { apiClient, toQueryString } from '@/core/http/api-client';
import type { Page } from '@/core/types/common.type';
import { saveBlob } from '@/core/utils/download.util';
import { formatExportDateSuffix } from '@/core/utils/date.util';

import type { ExampleItem, ExampleListQuery, ExampleUpsertPayload } from '../types';

export const exampleService = {
  list: (query: ExampleListQuery) =>
    apiClient.get<Page<ExampleItem>>(`/examples${toQueryString(query)}`),

  create: (payload: ExampleUpsertPayload) => apiClient.post<ExampleItem>('/examples', payload),

  update: (id: number, payload: ExampleUpsertPayload) =>
    apiClient.put<ExampleItem>(`/examples/${id}`, payload),

  remove: (id: number) => apiClient.delete(`/examples/${id}`),

  /** Download the filtered list as CSV. Pagination and sorting do not apply to exports. */
  exportCsv: async (query: ExampleListQuery) => {
    const { search, status, date_from, date_to } = query;
    const { blob, filename } = await apiClient.download(
      `/examples/export${toQueryString({ search, status, date_from, date_to })}`,
    );
    saveBlob(blob, filename ?? `examples-${formatExportDateSuffix()}.csv`);
  },
};
