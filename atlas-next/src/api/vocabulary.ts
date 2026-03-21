import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from './client';
import { queryKeys } from './types';
import type { Concept } from '@/types';

// ---------------------------------------------------------------------------
// Raw API functions
// ---------------------------------------------------------------------------

export const vocabularyApi = {
  search: (query: string, sourceKey: string) =>
    apiClient.get<Concept[]>(`vocabulary/${sourceKey}/search?query=${encodeURIComponent(query)}`),
  searchAdvanced: (params: Record<string, unknown>, sourceKey: string) =>
    apiClient.post<Concept[]>(`vocabulary/${sourceKey}/search`, params),
  getConcept: (id: number, sourceKey: string) =>
    apiClient.get<Concept>(`vocabulary/${sourceKey}/concept/${id}`),
  getInfo: (sourceKey: string) =>
    apiClient.get<{ version: string; dialect: string }>(`vocabulary/${sourceKey}/info`),
};

// ---------------------------------------------------------------------------
// TanStack Query hooks
// ---------------------------------------------------------------------------

export function useVocabularySearch(query: string, sourceKey: string) {
  return useQuery({
    queryKey: queryKeys.vocabulary.search(query, sourceKey),
    queryFn: () => vocabularyApi.search(query, sourceKey),
    enabled: query.length > 0 && sourceKey.length > 0,
  });
}

export function useVocabularyAdvancedSearch() {
  return useMutation({
    mutationFn: ({ params, sourceKey }: { params: Record<string, unknown>; sourceKey: string }) =>
      vocabularyApi.searchAdvanced(params, sourceKey),
  });
}
