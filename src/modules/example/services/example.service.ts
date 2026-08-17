import { apiClient } from '@/core/http/api-client';
import { envConfig } from '@/core/config/env.config';

import type {
  ExampleItem,
  ExampleListQuery,
  ExampleListResponse,
  ExampleUpsertPayload,
} from './types';

const USE_MOCK = true;

const seedItems = (): ExampleItem[] =>
  Array.from({ length: 48 }, (_, index) => {
    const id = index + 1;
    const day = String((id % 28) + 1).padStart(2, '0');
    return {
      id,
      code: `EX-${String(id).padStart(4, '0')}`,
      name: `Sample master item ${id}`,
      status: id % 9 === 0 ? 'inactive' : id % 5 === 0 ? 'draft' : 'active',
      created_at: `2026-03-${day}T08:00:00`,
      updated_at: `2026-07-${day}T14:30:00`,
    };
  });

let mockStore = seedItems();

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

const sortItems = (items: ExampleItem[], sortBy: string, sortOrder: 'asc' | 'desc') => {
  const factor = sortOrder === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const left = String((a as Record<string, unknown>)[sortBy] ?? '');
    const right = String((b as Record<string, unknown>)[sortBy] ?? '');
    return left.localeCompare(right, undefined, { numeric: true }) * factor;
  });
};

const listMock = async (query: ExampleListQuery): Promise<ExampleListResponse> => {
  await delay();
  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 20;
  const search = (query.search ?? '').trim().toLowerCase();
  let rows = mockStore;

  if (search) {
    rows = rows.filter(
      (item) => item.code.toLowerCase().includes(search) || item.name.toLowerCase().includes(search),
    );
  }
  if (query.date_from) {
    rows = rows.filter((item) => item.updated_at.slice(0, 10) >= query.date_from!);
  }
  if (query.date_to) {
    rows = rows.filter((item) => item.updated_at.slice(0, 10) <= query.date_to!);
  }

  rows = sortItems(rows, query.sort_by ?? 'updated_at', query.sort_order ?? 'desc');
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    total: rows.length,
    page,
    page_size: pageSize,
  };
};

const nextId = () => Math.max(0, ...mockStore.map((item) => item.id)) + 1;

/**
 * Replace mock implementations with apiClient calls when the backend module is ready.
 * Contract matches HIS list APIs: page (1-based), page_size, search, date_from, date_to, sort_by, sort_order.
 */
export const exampleService = {
  list: async (query: ExampleListQuery): Promise<ExampleListResponse> => {
    if (USE_MOCK) return listMock(query);
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') qs.set(key, String(value));
    });
    const res = await apiClient.get<ExampleListResponse>(`/examples?${qs.toString()}`);
    return res.data;
  },

  create: async (payload: ExampleUpsertPayload): Promise<ExampleItem> => {
    if (USE_MOCK) {
      await delay();
      const now = new Date().toISOString();
      const item: ExampleItem = { id: nextId(), ...payload, created_at: now, updated_at: now };
      mockStore = [item, ...mockStore];
      return item;
    }
    const res = await apiClient.post<ExampleItem>('/examples', payload);
    return res.data;
  },

  update: async (id: number, payload: ExampleUpsertPayload): Promise<ExampleItem> => {
    if (USE_MOCK) {
      await delay();
      mockStore = mockStore.map((item) =>
        item.id === id ? { ...item, ...payload, updated_at: new Date().toISOString() } : item,
      );
      return mockStore.find((item) => item.id === id)!;
    }
    const res = await apiClient.put<ExampleItem>(`/examples/${id}`, payload);
    return res.data;
  },

  remove: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      await delay();
      mockStore = mockStore.filter((item) => item.id !== id);
      return;
    }
    await apiClient.delete(`/examples/${id}`);
  },

  export: async (format: 'excel' | 'pdf', query: ExampleListQuery): Promise<void> => {
    if (USE_MOCK) {
      await delay(400);
      return;
    }
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '') qs.set(key, String(value));
    });
    qs.set('format', format);
    await fetch(`${envConfig.apiBaseUrl.replace(/\/$/, '')}/examples/export?${qs.toString()}`);
  },
};
