import { create } from 'zustand';
import type { Source } from '@/types';

export interface SourceStore {
  sources: Source[];
  vocabularyUrl: string | null;
  evidenceUrl: string | null;
  resultsUrl: string | null;
  defaultVocabularyUrl: string | null;
  defaultEvidenceUrl: string | null;
  defaultResultsUrl: string | null;

  setSources: (sources: Source[]) => void;
  setVocabularyUrl: (url: string | null) => void;
  setEvidenceUrl: (url: string | null) => void;
  setResultsUrl: (url: string | null) => void;
  setDefaults: (defaults: {
    vocabularyUrl: string | null;
    evidenceUrl: string | null;
    resultsUrl: string | null;
  }) => void;
  resetToDefaults: () => void;
}

export const useSourceStore = create<SourceStore>((set, get) => ({
  sources: [],
  vocabularyUrl: null,
  evidenceUrl: null,
  resultsUrl: null,
  defaultVocabularyUrl: null,
  defaultEvidenceUrl: null,
  defaultResultsUrl: null,

  setSources: (sources: Source[]) => {
    set({ sources });
  },

  setVocabularyUrl: (url: string | null) => {
    set({ vocabularyUrl: url });
  },

  setEvidenceUrl: (url: string | null) => {
    set({ evidenceUrl: url });
  },

  setResultsUrl: (url: string | null) => {
    set({ resultsUrl: url });
  },

  setDefaults: (defaults) => {
    set({
      defaultVocabularyUrl: defaults.vocabularyUrl,
      defaultEvidenceUrl: defaults.evidenceUrl,
      defaultResultsUrl: defaults.resultsUrl,
    });
  },

  resetToDefaults: () => {
    const state = get();
    set({
      vocabularyUrl: state.defaultVocabularyUrl,
      evidenceUrl: state.defaultEvidenceUrl,
      resultsUrl: state.defaultResultsUrl,
    });
  },
}));
