import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { ConceptSet } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const conceptSetApi = {
  getAll: () => apiClient.get<ConceptSet[]>('conceptset'),
  getById: (id: number) => apiClient.get<ConceptSet>(`conceptset/${id}`),
  create: (data: Partial<ConceptSet>) =>
    apiClient.post<ConceptSet>('conceptset', data),
  update: (id: number, data: Partial<ConceptSet>) =>
    apiClient.put<ConceptSet>(`conceptset/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`conceptset/${id}`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useConceptSets() {
  return useQuery({
    queryKey: queryKeys.conceptSets,
    queryFn: conceptSetApi.getAll,
  });
}

export function useConceptSet(id: number) {
  return useQuery({
    queryKey: queryKeys.conceptSet(id),
    queryFn: () => conceptSetApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateConceptSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ConceptSet>) => conceptSetApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conceptSets });
    },
  });
}

export function useDeleteConceptSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => conceptSetApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conceptSets });
    },
  });
}
