import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { Pathway } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const pathwayApi = {
  getAll: () => apiClient.get<Pathway[]>('pathway-analysis'),
  getById: (id: number) => apiClient.get<Pathway>(`pathway-analysis/${id}`),
  create: (data: Partial<Pathway>) => apiClient.post<Pathway>('pathway-analysis', data),
  update: (id: number, data: Partial<Pathway>) =>
    apiClient.put<Pathway>(`pathway-analysis/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`pathway-analysis/${id}`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function usePathways() {
  return useQuery({
    queryKey: queryKeys.pathways,
    queryFn: pathwayApi.getAll,
  });
}

export function usePathway(id: number) {
  return useQuery({
    queryKey: queryKeys.pathway(id),
    queryFn: () => pathwayApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreatePathway() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pathway>) => pathwayApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pathways });
    },
  });
}

export function useUpdatePathway() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pathway> }) =>
      pathwayApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pathways });
      queryClient.invalidateQueries({ queryKey: queryKeys.pathway(id) });
    },
  });
}

export function useDeletePathway() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pathwayApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pathways });
    },
  });
}
