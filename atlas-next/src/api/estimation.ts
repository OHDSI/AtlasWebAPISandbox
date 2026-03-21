import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { Estimation } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const estimationApi = {
  getAll: () => apiClient.get<Estimation[]>('estimation'),
  getById: (id: number) => apiClient.get<Estimation>(`estimation/${id}`),
  create: (data: Partial<Estimation>) => apiClient.post<Estimation>('estimation', data),
  update: (id: number, data: Partial<Estimation>) =>
    apiClient.put<Estimation>(`estimation/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`estimation/${id}`),
  copy: (id: number) => apiClient.get<Estimation>(`estimation/${id}/copy`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useEstimations() {
  return useQuery({
    queryKey: queryKeys.estimations,
    queryFn: estimationApi.getAll,
  });
}

export function useEstimation(id: number) {
  return useQuery({
    queryKey: queryKeys.estimation(id),
    queryFn: () => estimationApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateEstimation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Estimation>) => estimationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.estimations });
    },
  });
}

export function useUpdateEstimation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Estimation> }) =>
      estimationApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.estimations });
      queryClient.invalidateQueries({ queryKey: queryKeys.estimation(id) });
    },
  });
}

export function useDeleteEstimation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => estimationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.estimations });
    },
  });
}
