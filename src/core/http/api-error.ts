export type ApiFieldIssue = {
  loc: string[];
  message: string;
  type?: string;
};

/** Error envelope returned by the backend: `{"error": {"code", "message", "details"}}`. */
export type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: unknown };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, status: number, code = 'unknown_error', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  /** Validation problems keyed by field name (the last element of each error location). */
  get fieldErrors(): Record<string, string> {
    if (this.status !== 422 || !Array.isArray(this.details)) return {};
    const result: Record<string, string> = {};
    for (const issue of this.details as ApiFieldIssue[]) {
      const field = issue.loc?.[issue.loc.length - 1];
      if (field && !(field in result)) result[field] = issue.message;
    }
    return result;
  }
}

export const getErrorMessage = (error: unknown, fallback = 'Terjadi kesalahan.'): string =>
  error instanceof Error && error.message ? error.message : fallback;
