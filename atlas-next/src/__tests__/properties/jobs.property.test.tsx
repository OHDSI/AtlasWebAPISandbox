/**
 * Property-based tests for job status changes reflected in UI.
 *
 * Feature: react-typescript-migration, Property 19: Job status changes reflected in UI
 *
 * Validates: Requirements 11.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Job } from '@/types';

// ---------------------------------------------------------------------------
// Mock the jobs API hook
// ---------------------------------------------------------------------------

const mockJobsQuery = vi.fn();

vi.mock('@/api/jobs', () => ({
  useJobs: () => mockJobsQuery(),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const JOB_STATUSES = [
  'COMPLETED',
  'FAILED',
  'STARTED',
  'STARTING',
  'STOPPING',
  'STOPPED',
  'ABANDONED',
] as const;

const jobStatusArb = fc.constantFrom(...JOB_STATUSES);

const jobArb: fc.Arbitrary<Job> = fc.record({
  executionId: fc.integer({ min: 1, max: 100_000 }),
  jobName: fc.string({ minLength: 1, maxLength: 30 }).map((s) =>
    s.replace(/[^a-zA-Z0-9 _-]/g, 'x'),
  ).filter((s) => s.trim().length > 0),
  status: jobStatusArb,
  startDate: fc
    .integer({ min: 1577836800000, max: 1767225600000 }) // 2020-01-01 to 2025-12-31
    .map((ts) => new Date(ts).toISOString()),
  endDate: fc.oneof(
    fc.constant(null),
    fc
      .integer({ min: 1577836800000, max: 1767225600000 })
      .map((ts) => new Date(ts).toISOString()),
  ),
});

const jobsArrayArb = fc.array(jobArb, { minLength: 1, maxLength: 20 });

// ---------------------------------------------------------------------------
// Lazy import to ensure mocks are applied before module loads
// ---------------------------------------------------------------------------

let JobsPage: React.ComponentType;

beforeEach(async () => {
  vi.clearAllMocks();
  const mod = await import('@/pages/Jobs/index');
  JobsPage = mod.default;
});

// ---------------------------------------------------------------------------
// Property 19: Job status changes reflected in UI
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 19: Job status changes reflected in UI', () => {
  /**
   * **Validates: Requirements 11.3**
   *
   * For any random array of Job objects with random statuses
   * (COMPLETED, FAILED, STARTED, STARTING, STOPPING, STOPPED, ABANDONED),
   * the rendered JobsPage reflects all the job statuses from the data.
   */
  it('should reflect all job statuses in the rendered UI', () => {
    fc.assert(
      fc.property(jobsArrayArb, (jobs) => {
        mockJobsQuery.mockReturnValue({
          data: jobs,
          isLoading: false,
          error: null,
        });

        const { unmount } = render(<JobsPage />, { wrapper: createWrapper() });

        // Collect the statuses present on the first page (DataTable defaults to pageSize=10)
        const visibleJobs = jobs.slice(0, 10);

        for (const job of visibleJobs) {
          // Each job's status badge should be present in the document
          const badges = screen.getAllByTestId(`status-badge-${job.status.toLowerCase()}`);
          expect(badges.length).toBeGreaterThan(0);

          // At least one badge should contain the status text
          const hasMatchingText = badges.some((badge) => badge.textContent === job.status);
          expect(hasMatchingText).toBe(true);
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 11.3**
   *
   * For any random array of jobs, the count of status badges for each
   * status in the visible page matches the expected count from the data.
   */
  it('should display the correct count of each status in the visible page', () => {
    fc.assert(
      fc.property(jobsArrayArb, (jobs) => {
        mockJobsQuery.mockReturnValue({
          data: jobs,
          isLoading: false,
          error: null,
        });

        const { unmount } = render(<JobsPage />, { wrapper: createWrapper() });

        const visibleJobs = jobs.slice(0, 10);

        // Count expected statuses in visible jobs
        const expectedCounts = new Map<string, number>();
        for (const job of visibleJobs) {
          expectedCounts.set(job.status, (expectedCounts.get(job.status) ?? 0) + 1);
        }

        // Verify each status count matches
        for (const [status, expectedCount] of expectedCounts) {
          const badges = screen.getAllByTestId(`status-badge-${status.toLowerCase()}`);
          expect(badges.length).toBe(expectedCount);
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
