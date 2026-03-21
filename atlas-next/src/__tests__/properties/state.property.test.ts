import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useSourceStore } from '@/stores/source';

/**
 * Feature: react-typescript-migration, Property 18: データソースリセット
 * Validates: Requirements 10.3
 */
describe('Property 18: Data source reset to defaults', () => {
  beforeEach(() => {
    useSourceStore.setState({
      sources: [],
      vocabularyUrl: null,
      evidenceUrl: null,
      resultsUrl: null,
      defaultVocabularyUrl: null,
      defaultEvidenceUrl: null,
      defaultResultsUrl: null,
    });
  });

  it('should reset URLs to default values after arbitrary changes', () => {
    const urlArb = fc.oneof(
      fc.webUrl(),
      fc.constant(null),
    );

    fc.assert(
      fc.property(
        urlArb, urlArb, urlArb, // default values
        urlArb, urlArb, urlArb, // changed values
        (defVocab, defEvidence, defResults, newVocab, newEvidence, newResults) => {
          const store = useSourceStore;

          // Set defaults
          store.getState().setDefaults({
            vocabularyUrl: defVocab,
            evidenceUrl: defEvidence,
            resultsUrl: defResults,
          });

          // Change URLs to arbitrary values
          store.getState().setVocabularyUrl(newVocab);
          store.getState().setEvidenceUrl(newEvidence);
          store.getState().setResultsUrl(newResults);

          // Reset to defaults
          store.getState().resetToDefaults();

          const state = store.getState();
          expect(state.vocabularyUrl).toBe(defVocab);
          expect(state.evidenceUrl).toBe(defEvidence);
          expect(state.resultsUrl).toBe(defResults);
        },
      ),
      { numRuns: 100 },
    );
  });
});

import {
  restoreFromSessionStorage,
  persistToSessionStorage,
} from '@/hooks/useSessionStorage';

/**
 * Feature: react-typescript-migration, Property 7: セッションストレージ同期のラウンドトリップ
 * Validates: Requirements 3.5, 10.2
 */
describe('Property 7: Session storage sync round-trip', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useSourceStore.setState({
      sources: [],
      vocabularyUrl: null,
      evidenceUrl: null,
      resultsUrl: null,
      defaultVocabularyUrl: null,
      defaultEvidenceUrl: null,
      defaultResultsUrl: null,
    });
  });

  it('should round-trip URL values through sessionStorage', () => {
    const urlArb = fc.oneof(
      fc.webUrl(),
      fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.length > 0),
    );

    fc.assert(
      fc.property(urlArb, urlArb, urlArb, (vocabUrl, evidenceUrl, resultsUrl) => {
        // Set values in store
        useSourceStore.getState().setVocabularyUrl(vocabUrl);
        useSourceStore.getState().setEvidenceUrl(evidenceUrl);
        useSourceStore.getState().setResultsUrl(resultsUrl);

        // Persist to sessionStorage
        persistToSessionStorage('vocabularyUrl', vocabUrl);
        persistToSessionStorage('evidenceUrl', evidenceUrl);
        persistToSessionStorage('resultsUrl', resultsUrl);

        // Reset store
        useSourceStore.setState({
          vocabularyUrl: null,
          evidenceUrl: null,
          resultsUrl: null,
        });

        // Restore from sessionStorage
        restoreFromSessionStorage();

        const state = useSourceStore.getState();
        expect(state.vocabularyUrl).toBe(vocabUrl);
        expect(state.evidenceUrl).toBe(evidenceUrl);
        expect(state.resultsUrl).toBe(resultsUrl);
      }),
      { numRuns: 100 },
    );
  });

  it('should handle null values correctly (remove from sessionStorage)', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        // Set a value then null it
        persistToSessionStorage('vocabularyUrl', url);
        expect(sessionStorage.getItem('atlas.vocabularyUrl')).toBe(url);

        persistToSessionStorage('vocabularyUrl', null);
        expect(sessionStorage.getItem('atlas.vocabularyUrl')).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});

import { renderHook, act } from '@testing-library/react';
import { useDirtyFlag } from '@/hooks/useDirtyFlag';

/**
 * Feature: react-typescript-migration, Property 6: 未保存変更の検出と警告
 * Validates: Requirements 3.3, 3.4
 */
describe('Property 6: Unsaved change detection and warning', () => {
  it('should detect dirty state after changes and clean state after reset', () => {
    // Arbitrary domain object generator
    const domainObjectArb = fc.record({
      id: fc.integer({ min: 1, max: 10000 }),
      name: fc.string({ minLength: 1, maxLength: 50 }),
      description: fc.string({ maxLength: 200 }),
    });

    fc.assert(
      fc.property(domainObjectArb, domainObjectArb, (initial, modified) => {
        // Ensure initial and modified are different for the dirty test
        const areDifferent = JSON.stringify(initial) !== JSON.stringify(modified);

        const { result, rerender } = renderHook(
          ({ value }) => useDirtyFlag(value),
          { initialProps: { value: initial } },
        );

        // Set initial snapshot
        act(() => {
          result.current.setInitial(initial);
        });

        // Should not be dirty initially
        expect(result.current.isDirty).toBe(false);

        // Change to modified value
        rerender({ value: modified });

        // Should be dirty if values differ
        expect(result.current.isDirty).toBe(areDifferent);

        // Reset should clear dirty flag
        act(() => {
          result.current.reset();
        });
        expect(result.current.isDirty).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('should register beforeunload handler when dirty', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const initial = { id: 1, name: 'test' };
    const modified = { id: 1, name: 'changed' };

    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDirtyFlag(value),
      { initialProps: { value: initial } },
    );

    act(() => {
      result.current.setInitial(initial);
    });

    // Change to trigger dirty
    rerender({ value: modified });

    expect(result.current.isDirty).toBe(true);
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
