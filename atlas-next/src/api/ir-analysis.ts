import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { IRAnalysis } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const irAnalysisApi = {
  getAll: () => apiClient.get<IRAnalysis[]>('ir'),
  getById: (id: number) => apiClient.get<IRAnalysis>(`ir/${id}`),
  create: (data: Partial<IRAnalysis>) => apiClient.post<IRAnalysis>('ir', data),
  update: (id: number, data: Partial<IRAnalysis>) =>
    apiClient.put<IRAnalysis>(`ir/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`ir/${id}`),
  copy: (id: number) => apiClient.get<IRAnalysis>(`ir/${id}/copy`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useIRAnalyses() {
  return useQuery({
    queryKey: queryKeys.irAnalyses,
    queryFn: irAnalysisApi.getAll,
  });
}

export function useIRAnalysis(id: number) {
  return useQuery({
    queryKey: queryKeys.irAnalysis(id),
    queryFn: () => irAnalysisApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateIRAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IRAnalysis>) => irAnalysisApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.irAnalyses });
    },
  });
}

export function useUpdateIRAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<IRAnalysis> }) =>
      irAnalysisApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.irAnalyses });
      queryClient.invalidateQueries({ queryKey: queryKeys.irAnalysis(id) });
    },
  });
}

export function useDeleteIRAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => irAnalysisApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.irAnalyses });
    },
  });
}
