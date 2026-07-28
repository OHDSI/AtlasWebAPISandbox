import type { ComputedRef } from 'vue'

export type LocaleCode = string

export interface Locale {
  code: LocaleCode
  name: string
}

export interface Translations {
  [domain: string]: string | Translations
}

export interface LocaleFormat {
  date: {
    datetime: string
    datetimeWithSeconds: string
    dateOnly: string
    timeOnly: string
  }
  number: {
    decimal: string
    thousands: string
    grouping: number[]
  }
  currency?: {
    symbol: string
    position: 'before' | 'after'
  }
}

export interface TranslationBundle {
  locale: LocaleCode
  translations: Translations
  format?: LocaleFormat
  fetchedAt: Date
}

export interface TranslationCache {
  bundle: TranslationBundle
  cachedAt: number
  maxAge: number
}

export interface LocaleState {
  locale: LocaleCode
  translations: Translations
  availableLocales: Locale[]
  loading: boolean
  error: string | null
  translationCache: Map<LocaleCode, TranslationCache>
  initialized: boolean
}

export interface TranslationParams {
  [key: string]: string | number | boolean
}

export interface TranslationFunction {
  (key: string): ComputedRef<string>
  (key: string, params: TranslationParams): ComputedRef<string>
  (key: string, defaultValue: string): ComputedRef<string>
  (key: string, defaultValue: string, params: TranslationParams): ComputedRef<string>
}

export interface TranslationValueFunction {
  (key: string): string
  (key: string, params: TranslationParams): string
  (key: string, defaultValue: string): string
  (key: string, defaultValue: string, params: TranslationParams): string
}

export interface UseI18nReturn {
  t: TranslationFunction
  tv: TranslationValueFunction
  locale: ComputedRef<LocaleCode>
  availableLocales: ComputedRef<Locale[]>
  changeLocale: (locale: LocaleCode) => Promise<void>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  format: ComputedRef<LocaleFormat | undefined>
}

export interface I18nService {
  fetchLocales(): Promise<Locale[]>
  fetchTranslations(locale: LocaleCode): Promise<TranslationBundle>
}

export interface WebAPILocalesResponse {
  data: Locale[]
}

export interface WebAPITranslationsResponse {
  data: Translations
}
