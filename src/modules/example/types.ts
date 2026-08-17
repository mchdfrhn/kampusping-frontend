export type ExampleItemStatus = 'draft' | 'active' | 'inactive';

export type ExampleItem = {
  id: number;
  code: string;
  name: string;
  status: ExampleItemStatus;
  created_at: string;
  updated_at: string;
};

export type ExampleListQuery = {
  page?: number;
  page_size?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type ExampleListResponse = {
  items: ExampleItem[];
  total: number;
  page: number;
  page_size: number;
};

export type ExampleUpsertPayload = {
  code: string;
  name: string;
  status: ExampleItemStatus;
};
