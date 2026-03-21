import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Deep equality check using JSON serialization.
 * Suitable for plain domain objects (no functions, dates, etc.).
 */
function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export interface DirtyFlagResult {
  isDirty: boolean;
  reset: () => void;
  setInitial: (value: unknown) => void;
}

/**
 * Hook that detects unsaved changes by comparing the current value
 * against a stored initial snapshot.
 *
 * Works with any domain object: CohortDefinition, ConceptSet,
 * IRAnalysis, Pathway, Estimation, Prediction, CohortCharacterization.
 *
 * When isDirty is true, a `beforeunload` event listener warns the user
 * before leaving the page.
 *
 * @param currentValue - The current state of the domain object.
 */
export function useDirtyFlag(currentValue: unknown): DirtyFlagResult {
  const initialRef = useRef<unknown>(undefined);
  const [isDirty, setIsDirty] = useState(false);

  // Compare current value against initial snapshot
  useEffect(() => {
    if (initialRef.current === undefined) return;
    setIsDirty(!deepEqual(currentValue, initialRef.current));
  }, [currentValue]);

  // Set up beforeunload warning when dirty
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const reset = useCallback(() => {
    initialRef.current = JSON.parse(JSON.stringify(currentValue));
    setIsDirty(false);
  }, [currentValue]);

  const setInitial = useCallback((value: unknown) => {
    initialRef.current = JSON.parse(JSON.stringify(value));
    setIsDirty(false);
  }, []);

  return { isDirty, reset, setInitial };
}
