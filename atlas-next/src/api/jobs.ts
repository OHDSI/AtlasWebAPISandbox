import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { Job } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const jobsApi = {
  getAll: (hideStatuses: string[] = []) =>
    apiClient.get<Job[]>(`notifications?hide_statuses=${hideStatuses.join(',')}`),
  getById: (id: number) => apiClient.get<Job>(`job/${id}`),
  getExecutions: () =>
    apiClient.get<Job[]>('job/execution?comprehensivePage=true'),
  getLastViewedTime: () => apiClient.get<number | null>('notifications/viewed'),
  setLastViewedTime: (time: number) =>
    apiClient.post<void>('notifications/viewed', time),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useJobs(hideStatuses: string[] = []) {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => jobsApi.getAll(hideStatuses),
  });
}

export function useJobExecutions() {
  return useQuery({
    queryKey: [...queryKeys.jobs, 'executions'] as const,
    queryFn: jobsApi.getExecutions,
  });
}

export function useSetLastViewedTime() {
  return useMutation({
    mutationFn: (time: number) => jobsApi.setLastViewedTime(time),
  });
}
