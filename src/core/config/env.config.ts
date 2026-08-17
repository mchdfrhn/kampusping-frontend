export const envConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v1',
  iamBaseUrl: process.env.NEXT_PUBLIC_API_SERVICE_IAM ?? '',
};
