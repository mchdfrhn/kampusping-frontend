export const envConfig = {
  /** Base URL of the backend API, including the version prefix. */
  apiBaseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(
    /\/$/,
    '',
  ),
};
