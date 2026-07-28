import { defineStore } from 'pinia'
import type {
  Locale,
  LocaleCode,
  LocaleFormat,
  LocaleState,
  TranslationBundle,
  TranslationCache,
  Translations,
} from '@/types/i18n'
import { logger } from '@/utils/logger'

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000

const BUNDLED_LOCALES: Locale[] = [{ code: 'en', name: 'English' }]

const bundledTranslationLoaders: Record<LocaleCode, () => Promise<unknown>> = {
  en: () => import('@/locales/en.json'),
}

let bundledFallback: Translations | null = null

function unwrapTranslations(mod: unknown): Translations {
  return (mod as { default?: Translations }).default ?? (mod as unknown as Translations)
}

function extractLocaleFormat(mod: unknown): LocaleFormat | undefined {
  const source =
    mod && typeof mod === 'object' && 'default' in mod
      ? (mod as { default?: unknown }).default
      : mod

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return undefined
  }

  const candidate = source as Record<string, unknown>
  const format = candidate.format
  if (!format || typeof format !== 'object' || Array.isArray(format)) {
    return undefined
  }

  return format as LocaleFormat
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMergeTranslations(base: Translations, override: Translations): Translations {
  const out: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    const existing = out[key]
    if (isPlainObject(existing) && isPlainObject(value)) {
      out[key] = deepMergeTranslations(existing as Translations, value as Translations)
    } else {
      out[key] = value
    }
  }

  return out as Translations
}

function withFallback(bundle: Translations): Translations {
  return bundledFallback ? deepMergeTranslations(bundledFallback, bundle) : bundle
}

function loadBundledLocale(locale: LocaleCode): Promise<unknown> {
  const loader = bundledTranslationLoaders[locale]
  if (!loader) {
    return Promise.reject(new Error(`No bundled locale available for ${locale}`))
  }
  return loader()
}

export const useLocaleStore = defineStore('locale', {
  state: (): LocaleState => ({
    locale: 'en',
    translations: {},
    availableLocales: [],
    loading: false,
    error: null,
    translationCache: new Map<LocaleCode, TranslationCache>(),
    initialized: false,
  }),

  getters: {
    currentLocale: state => state.locale,
    isLoading: state => state.loading,
    hasError: state => state.error !== null,
    localeFormat: state => {
      const cached = state.translationCache.get(state.locale)
      return cached?.bundle.format
    },
  },

  actions: {
    async initialize(): Promise<void> {
      try {
        await this.loadFallbackTranslations()
        this.availableLocales = [...BUNDLED_LOCALES]
        await this.changeLocale('en')
        this.initialized = true
      } catch (error) {
        logger.error('LocaleStore', 'Failed to initialize locale store', error)
        this.error = 'Failed to initialize translations'
        this.initialized = true
      }
    },

    async fetchTranslations(locale: LocaleCode): Promise<void> {
      const cached = this.translationCache.get(locale)
      if (cached && this.isCacheValid(cached)) {
        this.translations = withFallback(cached.bundle.translations)
        return
      }

      const bundledLoader = bundledTranslationLoaders[locale]
      if (!bundledLoader) {
        logger.warn('LocaleStore', `No bundled translations for ${locale}, keeping English`)
        await this.loadFallbackTranslations()
        return
      }

      this.loading = true
      this.error = null
      try {
        const module = await loadBundledLocale(locale)
        const translations = unwrapTranslations(module)
        const bundle: TranslationBundle = {
          locale,
          translations,
          format: extractLocaleFormat(module),
          fetchedAt: new Date(),
        }
        this.translationCache.set(locale, {
          bundle,
          cachedAt: Date.now(),
          maxAge: CACHE_MAX_AGE,
        })
        this.translations = withFallback(translations)
      } catch (error) {
        logger.error('LocaleStore', `Failed to load bundled translations for ${locale}`, error)
        this.error = `Failed to load ${locale} translations. Falling back to English.`
        await this.loadFallbackTranslations()
      } finally {
        this.loading = false
      }
    },

    async changeLocale(locale: LocaleCode): Promise<void> {
      if (locale !== 'en') {
        logger.warn('LocaleStore', `Locale ${locale} not available, falling back to English`)
        locale = 'en'
      }

      await this.fetchTranslations(locale)
      this.locale = locale

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('locale', locale)
      }

      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', locale)
      }

      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }))
      }
    },

    detectBrowserLanguage(): LocaleCode {
      return 'en'
    },

    isLocaleAvailable(locale: LocaleCode): boolean {
      return locale === 'en'
    },

    isCacheValid(cache: TranslationCache): boolean {
      return Date.now() - cache.cachedAt < cache.maxAge
    },

    async loadFallbackTranslations(): Promise<void> {
      try {
        const module = await loadBundledLocale('en')
        const flat = unwrapTranslations(module)
        bundledFallback = flat
        this.translations = flat
      } catch (error) {
        logger.error('LocaleStore', 'Failed to load fallback translations', error)
        this.translations = {
          common: {
            error: 'Error',
            loading: 'Loading...',
            save: 'Save',
            cancel: 'Cancel',
          },
        }
      }
    },

    clearCache(): void {
      this.translationCache.clear()
      if (typeof localStorage === 'undefined') {
        return
      }

      Object.keys(localStorage)
        .filter(key => key.startsWith('translations_'))
        .forEach(key => localStorage.removeItem(key))
    },
  },
})
