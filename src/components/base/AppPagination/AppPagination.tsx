import Pagination, { type PaginationProps } from '@mui/material/Pagination';

export type AppPaginationProps = PaginationProps;

export const AppPagination = (props: AppPaginationProps) => (
  <Pagination color="primary" {...props} />
);
