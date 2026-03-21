import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { Source } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const sourceApi = {
  getAll: () => apiClient.get<Source[]>('source/sources'),
  getDaimonPriority: () =>
    apiClient.get<Record<string, { sourceKey: string }>>('source/daimon/priority'),
  create: (data: FormData | Record<string, unknown>) =>
    apiClient.post<Source>('source', data),
  update: (sourceKey: string, data: FormData | Record<string, unknown>) =>
    apiClient.put<Source>(`source/${sourceKey}`, data),
  delete: (sourceKey: string) => apiClient.delete<void>(`source/${sourceKey}`),
  checkConnection: (sourceKey: string) =>
    apiClient.get<unknown>(`source/connection/${sourceKey}`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useSources() {
  return useQuery({
    queryKey: queryKeys.sources,
    queryFn: sourceApi.getAll,
  });
}

export function useCreateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) => sourceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sources });
    },
  });
}

export function useUpdateSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceKey, data }: { sourceKey: string; data: FormData | Record<string, unknown> }) =>
      sourceApi.update(sourceKey, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sources });
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceKey: string) => sourceApi.delete(sourceKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sources });
    },
  });
}
