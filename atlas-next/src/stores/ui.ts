import { create } from 'zustand';

export interface UIStore {
  locale: string;
  availableLocales: string[];
  setLocale: (locale: string) => void;
  setAvailableLocales: (locales: string[]) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  locale: 'en',
  availableLocales: ['en'],

  setLocale: (locale: string) => {
    set({ locale });
  },

  setAvailableLocales: (locales: string[]) => {
    set({ availableLocales: locales });
  },
}));
