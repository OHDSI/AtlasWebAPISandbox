import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { Prediction } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const predictionApi = {
  getAll: () => apiClient.get<Prediction[]>('prediction'),
  getById: (id: number) => apiClient.get<Prediction>(`prediction/${id}`),
  create: (data: Partial<Prediction>) => apiClient.post<Prediction>('prediction', data),
  update: (id: number, data: Partial<Prediction>) =>
    apiClient.put<Prediction>(`prediction/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`prediction/${id}`),
  copy: (id: number) => apiClient.get<Prediction>(`prediction/${id}/copy`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function usePredictions() {
  return useQuery({
    queryKey: queryKeys.predictions,
    queryFn: predictionApi.getAll,
  });
}

export function usePrediction(id: number) {
  return useQuery({
    queryKey: queryKeys.prediction(id),
    queryFn: () => predictionApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreatePrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Prediction>) => predictionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions });
    },
  });
}

export function useUpdatePrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Prediction> }) =>
      predictionApi.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions });
      queryClient.invalidateQueries({ queryKey: queryKeys.prediction(id) });
    },
  });
}

export function useDeletePrediction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => predictionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.predictions });
    },
  });
}
