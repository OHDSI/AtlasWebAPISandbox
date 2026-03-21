/**
 * Property-based tests for loading state display.
 *
 * Feature: react-typescript-migration, Property 13: Loading state display
 *
 * Validates: Requirements 6.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Page components
import HomePage from '@/pages/Home';
import CohortDefinitionsPage from '@/pages/CohortDefinitions';
import ConceptSetsPage from '@/pages/ConceptSets';
import CharacterizationsPage from '@/pages/Characterizations';
import IncidenceRatesPage from '@/pages/IncidenceRates';

// ---------------------------------------------------------------------------
// Mock TanStack Query hooks to control isLoading state
// ---------------------------------------------------------------------------

const mockSourceQuery = vi.fn();
const mockVocabSearchQuery = vi.fn();
const mockCohortDefsQuery = vi.fn();
const mockCohortDefQuery = vi.fn();
const mockConceptSetsQuery = vi.fn();
const mockCharacterizationsQuery = vi.fn();
const mockIRAnalysesQuery = vi.fn();

vi.mock('@/api/source', () => ({
  useSources: () => mockSourceQuery(),
}));

vi.mock('@/api/vocabulary', () => ({
  useVocabularySearch: () => mockVocabSearchQuery(),
}));

vi.mock('@/api/cohort-definition', () => ({
  useCohortDefinitions: () => mockCohortDefsQuery(),
  useCohortDefinition: () => mockCohortDefQuery(),
}));

vi.mock('@/api/concept-set', () => ({
  useConceptSets: () => mockConceptSetsQuery(),
}));

vi.mock('@/api/characterization', () => ({
  useCharacterizations: () => mockCharacterizationsQuery(),
}));

vi.mock('@/api/ir-analysis', () => ({
  useIRAnalyses: () => mockIRAnalysesQuery(),
}));

vi.mock('@/stores/source', () => ({
  useSourceStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ sources: [], vocabularyUrl: null, evidenceUrl: null, resultsUrl: null }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

interface PageEntry {
  name: string;
  Component: React.ComponentType;
  setLoading: () => void;
  setLoaded: () => void;
}

const pages: PageEntry[] = [
  {
    name: 'Home',
    Component: HomePage,
    setLoading: () => mockSourceQuery.mockReturnValue({ data: undefined, isLoading: true, error: null }),
    setLoaded: () => mockSourceQuery.mockReturnValue({ data: [{ sourceId: 1, sourceName: 'S1', sourceKey: 'k1', sourceDialect: 'pg', daimons: [] }], isLoading: false, error: null }),
  },
  {
    name: 'CohortDefinitions',
    Component: CohortDefinitionsPage,
    setLoading: () => mockCohortDefsQuery.mockReturnValue({ data: undefined, isLoading: true, error: null }),
    setLoaded: () => mockCohortDefsQuery.mockReturnValue({ data: [{ id: 1, name: 'C1', description: '', expressionType: '', expression: { items: [] }, createdBy: 'u', createdDate: '', modifiedBy: '', modifiedDate: '', tags: [] }], isLoading: false, error: null }),
  },
  {
    name: 'ConceptSets',
    Component: ConceptSetsPage,
    setLoading: () => mockConceptSetsQuery.mockReturnValue({ data: undefined, isLoading: true, error: null }),
    setLoaded: () => mockConceptSetsQuery.mockReturnValue({ data: [{ id: 1, name: 'CS1', expression: { items: [] } }], isLoading: false, error: null }),
  },
  {
    name: 'Characterizations',
    Component: CharacterizationsPage,
    setLoading: () => mockCharacterizationsQuery.mockReturnValue({ data: undefined, isLoading: true, error: null }),
    setLoaded: () => mockCharacterizationsQuery.mockReturnValue({ data: [{ id: 1, name: 'Ch1', description: '', featureAnalyses: [] }], isLoading: false, error: null }),
  },
  {
    name: 'IncidenceRates',
    Component: IncidenceRatesPage,
    setLoading: () => mockIRAnalysesQuery.mockReturnValue({ data: undefined, isLoading: true, error: null }),
    setLoaded: () => mockIRAnalysesQuery.mockReturnValue({ data: [{ id: 1, name: 'IR1', description: '', expression: null }], isLoading: false, error: null }),
  },
];

const pageArb = fc.constantFrom(...pages);

// ---------------------------------------------------------------------------
// Property 13: Loading state display
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 13: Loading state display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default non-loading state for all mocks
    mockSourceQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    mockVocabSearchQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockCohortDefsQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    mockCohortDefQuery.mockReturnValue({ data: undefined, isLoading: false, error: null });
    mockConceptSetsQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    mockCharacterizationsQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    mockIRAnalysesQuery.mockReturnValue({ data: [], isLoading: false, error: null });
  });

  /**
   * **Validates: Requirements 6.5**
   *
   * For any page component, when data is being fetched (isLoading=true),
   * a loading indicator is displayed.
   */
  it('should display loading indicator when isLoading is true for any page', () => {
    fc.assert(
      fc.property(pageArb, (page) => {
        // Set the page's query hook to loading state
        page.setLoading();

        const { unmount } = render(<page.Component />, { wrapper: createWrapper() });

        // The loading indicator should be present
        const loadingEl = screen.getByTestId('loading');
        expect(loadingEl).toBeInTheDocument();
        expect(loadingEl).toHaveAttribute('role', 'status');
        expect(loadingEl).toHaveAttribute('aria-busy', 'true');

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  /**
   * **Validates: Requirements 6.5**
   *
   * For any page component, when data has loaded (isLoading=false),
   * the loading indicator is NOT displayed.
   */
  it('should NOT display loading indicator when isLoading is false for any page', () => {
    fc.assert(
      fc.property(pageArb, (page) => {
        // Set the page's query hook to loaded state
        page.setLoaded();

        const { unmount } = render(<page.Component />, { wrapper: createWrapper() });

        // The loading indicator should NOT be present
        const loadingEls = screen.queryAllByTestId('loading');
        expect(loadingEls.length).toBe(0);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
