import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { CohortDefinition } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const cohortDefinitionApi = {
  getAll: () => apiClient.get<CohortDefinition[]>('cohortdefinition'),
  getById: (id: number) => apiClient.get<CohortDefinition>(`cohortdefinition/${id}`),
  create: (data: Partial<CohortDefinition>) =>
    apiClient.post<CohortDefinition>('cohortdefinition', data),
  update: (id: number, data: Partial<CohortDefinition>) =>
    apiClient.put<CohortDefinition>(`cohortdefinition/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`cohortdefinition/${id}`),
  copy: (id: number) => apiClient.get<CohortDefinition>(`cohortdefinition/${id}/copy`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useCohortDefinitions() {
  return useQuery({
    queryKey: queryKeys.cohortDefinitions,
    queryFn: cohortDefinitionApi.getAll,
  });
}

export function useCohortDefinition(id: number) {
  return useQuery({
    queryKey: queryKeys.cohortDefinition(id),
    queryFn: () => cohortDefinitionApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateCohortDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CohortDefinition>) => cohortDefinitionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cohortDefinitions });
    },
  });
}

export function useUpdateCohortDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CohortDefinition> }) =>
      cohortDefinitionApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cohortDefinitions });
      queryClient.invalidateQueries({ queryKey: queryKeys.cohortDefinition(id) });
    },
  });
}

export function useDeleteCohortDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cohortDefinitionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cohortDefinitions });
    },
  });
}
