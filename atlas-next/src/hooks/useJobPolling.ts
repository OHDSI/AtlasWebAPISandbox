import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '@/api/jobs';
import { queryKeys } from '@/api/types';
import { getConfig } from '@/config';
import type { Job } from '@/types';

const DEFAULT_POLL_INTERVAL = 10_000; // 10 seconds

export interface UseJobPollingOptions {
  /** Polling interval in milliseconds. Defaults to 10 000 ms. */
  interval?: number;
  /** Whether polling is enabled. Defaults to true. */
  enabled?: boolean;
}

/**
 * Hook that polls for job status updates using TanStack Query's
 * built-in `refetchInterval` option.
 *
 * Polling is only active when the execution engine is available
 * (as reported by `AppConfig.api.isExecutionEngineAvailable`) AND
 * the caller has not explicitly disabled it.
 *
 * Validates: Requirements 11.1, 11.2
 */
export function useJobPolling(options?: UseJobPollingOptions): {
  jobs: Job[];
  isPolling: boolean;
} {
  const { interval = DEFAULT_POLL_INTERVAL, enabled = true } = options ?? {};

  const isEngineAvailable = getConfig().api.isExecutionEngineAvailable ?? false;
  const shouldPoll = enabled && isEngineAvailable;

  const { data, isFetching } = useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => jobsApi.getAll(),
    refetchInterval: shouldPoll ? interval : false,
    enabled: shouldPoll,
  });

  return {
    jobs: data ?? [],
    isPolling: shouldPoll && isFetching,
  };
}
