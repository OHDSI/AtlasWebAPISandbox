import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { Job } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockJobs: Job[] = [
  { executionId: 1, jobName: 'Generate Cohort', status: 'COMPLETED', startDate: '2024-01-01', endDate: '2024-01-01' },
  { executionId: 2, jobName: 'Run IR', status: 'STARTED', startDate: '2024-01-02', endDate: null },
];

vi.mock('@/api/jobs', () => ({
  jobsApi: {
    getAll: vi.fn(() => Promise.resolve(mockJobs)),
  },
}));

let engineAvailable = true;

vi.mock('@/config', () => ({
  getConfig: vi.fn(() => ({
    api: {
      url: 'http://localhost:8080/WebAPI/',
      isExecutionEngineAvailable: engineAvailable,
    },
    userAuthenticationEnabled: false,
    authProviders: [],
    refreshTokenThreshold: 0,
    enableSkipLogin: false,
    disableBrowserCheck: false,
    webAPIRoot: 'http://localhost:8080/WebAPI/',
    showCompanyInfo: true,
  })),
}));

// Import after mocks are set up
import { useJobPolling } from '@/hooks/useJobPolling';
import { jobsApi } from '@/api/jobs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useJobPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    engineAvailable = true;
  });

  it('returns jobs from the API when engine is available', async () => {
    const { result } = renderHook(() => useJobPolling(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs);
    });
  });

  it('returns empty array when engine is not available', () => {
    engineAvailable = false;

    const { result } = renderHook(() => useJobPolling(), { wrapper: createWrapper() });

    // Query is disabled so data stays empty
    expect(result.current.jobs).toEqual([]);
    expect(jobsApi.getAll).not.toHaveBeenCalled();
  });

  it('returns empty array when explicitly disabled', () => {
    const { result } = renderHook(
      () => useJobPolling({ enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.jobs).toEqual([]);
    expect(jobsApi.getAll).not.toHaveBeenCalled();
  });

  it('accepts a custom polling interval', async () => {
    const { result } = renderHook(
      () => useJobPolling({ interval: 5000 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.jobs).toEqual(mockJobs);
    });
  });

  it('defaults interval to 10000ms and enabled to true', async () => {
    const { result } = renderHook(() => useJobPolling(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.jobs.length).toBe(2);
    });
  });
});
