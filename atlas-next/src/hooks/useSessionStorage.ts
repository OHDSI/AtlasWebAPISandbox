import { useEffect } from 'react';
import { useSourceStore } from '@/stores/source';

const SESSION_KEYS = {
  vocabularyUrl: 'atlas.vocabularyUrl',
  evidenceUrl: 'atlas.evidenceUrl',
  resultsUrl: 'atlas.resultsUrl',
} as const;

/**
 * Restore URL values from sessionStorage into the SourceStore.
 * Called once on initialization to hydrate the store.
 */
export function restoreFromSessionStorage(): void {
  const vocab = sessionStorage.getItem(SESSION_KEYS.vocabularyUrl);
  const evidence = sessionStorage.getItem(SESSION_KEYS.evidenceUrl);
  const results = sessionStorage.getItem(SESSION_KEYS.resultsUrl);

  const store = useSourceStore.getState();
  if (vocab !== null) store.setVocabularyUrl(vocab);
  if (evidence !== null) store.setEvidenceUrl(evidence);
  if (results !== null) store.setResultsUrl(results);
}

/**
 * Persist a single URL value to sessionStorage.
 * If the value is null, the key is removed.
 */
export function persistToSessionStorage(
  key: keyof typeof SESSION_KEYS,
  value: string | null,
): void {
  if (value === null) {
    sessionStorage.removeItem(SESSION_KEYS[key]);
  } else {
    sessionStorage.setItem(SESSION_KEYS[key], value);
  }
}

/**
 * React hook that keeps SourceStore URL fields in sync with sessionStorage.
 * - On mount: restores values from sessionStorage into the store.
 * - On store changes: persists updated values to sessionStorage.
 */
export function useSessionStorage(): void {
  useEffect(() => {
    restoreFromSessionStorage();

    const unsubscribe = useSourceStore.subscribe((state, prevState) => {
      if (state.vocabularyUrl !== prevState.vocabularyUrl) {
        persistToSessionStorage('vocabularyUrl', state.vocabularyUrl);
      }
      if (state.evidenceUrl !== prevState.evidenceUrl) {
        persistToSessionStorage('evidenceUrl', state.evidenceUrl);
      }
      if (state.resultsUrl !== prevState.resultsUrl) {
        persistToSessionStorage('resultsUrl', state.resultsUrl);
      }
    });

    return unsubscribe;
  }, []);
}
