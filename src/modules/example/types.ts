import type { ListQuery } from '@/core/types/common.type';

export type ExampleItemStatus = 'draft' | 'active' | 'inactive';

export const EXAMPLE_STATUSES: { value: ExampleItemStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export type ExampleItem = {
  id: number;
  code: string;
  name: string;
  status: ExampleItemStatus;
  created_at: string;
  updated_at: string;
};

export type ExampleFilters = {
  status?: ExampleItemStatus;
  /** YYYY-MM-DD, inclusive */
  date_from?: string;
  /** YYYY-MM-DD, inclusive */
  date_to?: string;
};

export type ExampleListQuery = ListQuery & ExampleFilters;

export type ExampleUpsertPayload = {
  code: string;
  name: string;
  status: ExampleItemStatus;
};
