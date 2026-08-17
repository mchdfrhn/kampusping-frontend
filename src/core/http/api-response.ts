export type ApiClientResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};
