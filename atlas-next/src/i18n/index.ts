import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import { useUIStore } from '@/stores/ui';

const resources = {
  en: { translation: en },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/**
 * Change the active locale. Updates both i18next and UIStore.
 */
export async function changeLanguage(locale: string): Promise<void> {
  await i18n.changeLanguage(locale);
  useUIStore.getState().setLocale(locale);
}

/**
 * Add a new locale resource bundle at runtime (e.g. fetched from WebAPI).
 */
export function addLocaleResource(
  locale: string,
  translations: Record<string, unknown>,
): void {
  i18n.addResourceBundle(locale, 'translation', translations, true, true);
}

export default i18n;
