import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/core/http/api-client';

import { reportsService } from './reports.service';

vi.mock('@/core/http/api-client', async () => {
  // Keep the real query-string builder; only the HTTP client is replaced.
  const original = await vi.importActual<{ toQueryString: (query: object) => string }>(
    '@/core/http/api-client',
  );
  return { toQueryString: original.toQueryString, apiClient: { get: vi.fn(), download: vi.fn() } };
});

const client = vi.mocked(apiClient);

beforeEach(() => {
  vi.resetAllMocks();
});

describe('reportsService', () => {
  it('loads the semester options', async () => {
    client.get.mockResolvedValue({ semesters: ['2026/2027'] });
    const signal = new AbortController().signal;

    await reportsService.options(signal);

    expect(client.get).toHaveBeenCalledWith('/reports/options', { signal });
  });

  it('asks for the weekly preview without a semester', async () => {
    await reportsService.preview('weekly');

    expect(client.get).toHaveBeenCalledWith('/reports/billing?preset=weekly', {
      signal: undefined,
    });
  });

  it('asks for the semester preview with the semester encoded', async () => {
    await reportsService.preview('semester', 'Ganjil 2026/2027');

    expect(client.get).toHaveBeenCalledWith(
      '/reports/billing?preset=semester&semester=Ganjil+2026%2F2027',
      { signal: undefined },
    );
  });

  it('downloads the export in the chosen format', async () => {
    client.download.mockResolvedValue({ blob: new Blob(), filename: 'laporan.pdf' });

    const result = await reportsService.download('semester', 'Genap 2026/2027', 'pdf');

    expect(client.download).toHaveBeenCalledWith(
      '/reports/billing/export?preset=semester&semester=Genap+2026%2F2027&format=pdf',
    );
    expect(result.filename).toBe('laporan.pdf');
  });

  it('downloads the weekly export without a semester parameter', async () => {
    await reportsService.download('weekly', undefined, 'xlsx');

    expect(client.download).toHaveBeenCalledWith(
      '/reports/billing/export?preset=weekly&format=xlsx',
    );
  });
});
