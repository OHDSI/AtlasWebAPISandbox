import { QueryClient } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// TanStack Query – Query Key definitions
// ---------------------------------------------------------------------------

export const queryKeys = {
  cohortDefinitions: ['cohortDefinitions'] as const,
  cohortDefinition: (id: number) => ['cohortDefinition', id] as const,
  conceptSets: ['conceptSets'] as const,
  conceptSet: (id: number) => ['conceptSet', id] as const,
  irAnalyses: ['irAnalyses'] as const,
  irAnalysis: (id: number) => ['irAnalysis', id] as const,
  estimations: ['estimations'] as const,
  estimation: (id: number) => ['estimation', id] as const,
  predictions: ['predictions'] as const,
  prediction: (id: number) => ['prediction', id] as const,
  characterizations: ['characterizations'] as const,
  characterization: (id: number) => ['characterization', id] as const,
  pathways: ['pathways'] as const,
  pathway: (id: number) => ['pathway', id] as const,
  jobs: ['jobs'] as const,
  sources: ['sources'] as const,
  vocabulary: {
    search: (query: string, sourceKey: string) =>
      ['vocabulary', 'search', sourceKey, query] as const,
  },
  userInfo: ['userInfo'] as const,
} as const;

// ---------------------------------------------------------------------------
// TanStack Query – QueryClient factory
// ---------------------------------------------------------------------------

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
