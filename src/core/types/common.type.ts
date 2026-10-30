export type Nullable<T> = T | null;

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type SortOrder = 'asc' | 'desc';

/** Standard list query accepted by every list endpoint. */
export type ListQuery = {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: SortOrder;
};

/** Standard list response returned by every list endpoint. */
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};
