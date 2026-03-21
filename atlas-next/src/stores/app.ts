import { create } from 'zustand';
import type { AppInitializationStatus } from '@/types';

export interface AppStore {
  initializationStatus: AppInitializationStatus;
  loading: boolean;
  errorMessage: string | null;
  setInitializationStatus: (status: AppInitializationStatus) => void;
  setLoading: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  clearErrorMessage: () => void;
}

/**
 * Valid transitions from each initialization status.
 * - 'initializing' can transition to 'running', 'failed', or 'noSourcesAvailable'
 * - 'noSourcesAvailable' can transition to 'running' (after sources are added)
 * - 'running' and 'failed' are terminal states
 */
const validTransitions: Record<AppInitializationStatus, AppInitializationStatus[]> = {
  initializing: ['running', 'failed', 'noSourcesAvailable'],
  noSourcesAvailable: ['running'],
  running: [],
  failed: [],
};

export function isValidTransition(
  from: AppInitializationStatus,
  to: AppInitializationStatus,
): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

export const useAppStore = create<AppStore>((set, get) => ({
  initializationStatus: 'initializing',
  loading: false,
  errorMessage: null,

  setInitializationStatus: (status: AppInitializationStatus) => {
    const current = get().initializationStatus;
    if (isValidTransition(current, status)) {
      set({ initializationStatus: status });
    }
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setErrorMessage: (message: string | null) => {
    set({ errorMessage: message });
  },

  clearErrorMessage: () => {
    set({ errorMessage: null });
  },
}));
