'use client';

import type { GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  DEFAULT_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  SEARCH_MIN_CHARS,
} from '@/core/constants/app.constant';
import { getErrorMessage } from '@/core/http/api-error';
import type { ListQuery, Page, SortOrder } from '@/core/types/common.type';

import { useDebounce } from './useDebounce';

type Options<Row, Extra extends object> = {
  fetcher: (query: ListQuery & Extra) => Promise<Page<Row>>;
  defaultSort: { field: string; order: SortOrder };
  /** Additional filters (status, dates...). A change resets to the first page. */
  filters?: Extra;
  onError?: (message: string) => void;
};

type Loaded<Row> = { key: string; rows: Row[]; total: number };

/**
 * State and data loading for a server-paginated list: pagination, sorting, debounced search and
 * reloads, following the standard list contract (`page`, `page_size`, `search`, `sort_*`).
 *
 * `loading` is derived (the latest response does not match the current request) rather than
 * stored, so the effect only ever sets state from the async result.
 */
export const useServerGrid = <Row, Extra extends object = Record<never, never>>({
  fetcher,
  defaultSort,
  filters,
  onError,
}: Options<Row, Extra>) => {
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<GridPaginationModel>({
    page: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [sort, setSort] = useState(defaultSort);
  const [reloadCount, setReloadCount] = useState(0);
  const [loaded, setLoaded] = useState<Loaded<Row> | null>(null);

  // Short queries are ignored: searching "a" would scan the whole table for little value.
  const debounced = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const effectiveSearch = debounced.length >= SEARCH_MIN_CHARS ? debounced : '';
  const filtersKey = JSON.stringify(filters ?? {});

  // Changing what is listed starts again from the first page. Adjusting state while rendering is
  // the documented alternative to an effect here: it avoids a render with the stale page.
  const resetKey = `${effectiveSearch}|${filtersKey}`;
  const [previousResetKey, setPreviousResetKey] = useState(resetKey);
  if (resetKey !== previousResetKey) {
    setPreviousResetKey(resetKey);
    setPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
  }

  const query = useMemo(
    () =>
      ({
        page: pagination.page + 1,
        page_size: pagination.pageSize,
        search: effectiveSearch || undefined,
        sort_by: sort.field,
        sort_order: sort.order,
        ...(JSON.parse(filtersKey) as Extra),
      }) satisfies ListQuery,
    [pagination, effectiveSearch, sort, filtersKey],
  );
  const requestKey = `${reloadCount}:${JSON.stringify(query)}`;

  const fetcherRef = useRef(fetcher);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    fetcherRef.current = fetcher;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current(query)
      .then((data) => {
        if (!cancelled) setLoaded({ key: requestKey, rows: data.items, total: data.total });
      })
      .catch((error) => {
        if (cancelled) return;
        onErrorRef.current?.(getErrorMessage(error, 'Failed to load data.'));
        setLoaded((previous) => ({
          key: requestKey,
          rows: previous?.rows ?? [],
          total: previous?.total ?? 0,
        }));
      });
    return () => {
      cancelled = true; // a newer request superseded this one
    };
  }, [query, requestKey]);

  const rows = useMemo(() => loaded?.rows ?? [], [loaded]);
  const total = loaded?.total ?? 0;
  const loading = loaded?.key !== requestKey;

  const sortModel = useMemo<GridSortModel>(() => [{ field: sort.field, sort: sort.order }], [sort]);

  const onSortModelChange = useCallback(
    (model: GridSortModel) => {
      const next = model[0];
      setSort(next ? { field: next.field, order: next.sort ?? defaultSort.order } : defaultSort);
      setPagination((current) => (current.page === 0 ? current : { ...current, page: 0 }));
    },
    [defaultSort],
  );

  /** Re-run the current query, e.g. after a create, update or delete. */
  const reload = useCallback(async () => {
    setReloadCount((count) => count + 1);
  }, []);

  return {
    rows,
    total,
    loading,
    search,
    setSearch,
    /** The debounced search actually sent to the API (empty while shorter than 3 characters). */
    effectiveSearch,
    sort,
    reload,
    gridProps: {
      rows,
      rowCount: total,
      loading,
      paginationMode: 'server' as const,
      sortingMode: 'server' as const,
      paginationModel: pagination,
      onPaginationModelChange: setPagination,
      sortModel,
      onSortModelChange,
    },
  };
};
