import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { CohortCharacterization } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const characterizationApi = {
  getAll: () => apiClient.get<CohortCharacterization[]>('cohort-characterization'),
  getById: (id: number) =>
    apiClient.get<CohortCharacterization>(`cohort-characterization/${id}/design`),
  create: (data: Partial<CohortCharacterization>) =>
    apiClient.post<CohortCharacterization>('cohort-characterization', data),
  update: (id: number, data: Partial<CohortCharacterization>) =>
    apiClient.put<CohortCharacterization>(`cohort-characterization/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`cohort-characterization/${id}`),
  copy: (id: number) =>
    apiClient.post<CohortCharacterization>(`cohort-characterization/${id}`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useCharacterizations() {
  return useQuery({
    queryKey: queryKeys.characterizations,
    queryFn: characterizationApi.getAll,
  });
}

export function useCharacterization(id: number) {
  return useQuery({
    queryKey: queryKeys.characterization(id),
    queryFn: () => characterizationApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateCharacterization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CohortCharacterization>) => characterizationApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterizations });
    },
  });
}

export function useUpdateCharacterization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CohortCharacterization> }) =>
      characterizationApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterizations });
      queryClient.invalidateQueries({ queryKey: queryKeys.characterization(id) });
    },
  });
}

export function useDeleteCharacterization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => characterizationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characterizations });
    },
  });
}
