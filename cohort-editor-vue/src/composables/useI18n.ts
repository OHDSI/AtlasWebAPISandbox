import { computed } from 'vue'
import type { ComputedRef } from 'vue'
import { useLocaleStore } from '@/stores/locale'
import { logger } from '@/utils/logger'
import type {
  Locale,
  LocaleCode,
  LocaleFormat,
  TranslationParams,
  UseI18nReturn,
} from '@/types/i18n'

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.')
  let value: unknown = obj

  for (const key of keys) {
    if (value === undefined || value === null) {
      return undefined
    }
    value = (value as Record<string, unknown>)[key]
  }

  return typeof value === 'string' ? value : undefined
}

function interpolate(template: string, params: TranslationParams): string {
  return template
    .replace(/\{(\w+)\}/g, (match, key) =>
      params[key] !== undefined ? String(params[key]) : match
    )
    .replace(/<%=\s*(\w+)\s*%>/g, (match, key) =>
      params[key] !== undefined ? String(params[key]) : match
    )
}

function getTranslation(
  localeStore: ReturnType<typeof useLocaleStore>,
  key: string,
  defaultValueOrParams?: string | TranslationParams,
  params?: TranslationParams
): string {
  let defaultValue = ''
  let translationParams: TranslationParams | undefined

  if (typeof defaultValueOrParams === 'object') {
    translationParams = defaultValueOrParams
  } else if (typeof defaultValueOrParams === 'string') {
    defaultValue = defaultValueOrParams
    translationParams = params
  }

  let translation = getNestedValue(localeStore.translations, key)

  if (!translation && localeStore.initialized) {
    logger.warn('i18n', `Missing translation for key: "${key}" in locale: ${localeStore.locale}`)
  }

  if (!translation) {
    translation = defaultValue || key
  }

  if (translationParams) {
    translation = interpolate(translation, translationParams)
  }

  return translation
}

export function useI18n(): UseI18nReturn {
  const localeStore = useLocaleStore()

  const t = (
    key: string,
    defaultValueOrParams?: string | TranslationParams,
    params?: TranslationParams
  ): ComputedRef<string> => {
    return computed(() => getTranslation(localeStore, key, defaultValueOrParams, params))
  }

  const tv = (
    key: string,
    defaultValueOrParams?: string | TranslationParams,
    params?: TranslationParams
  ): string => {
    return getTranslation(localeStore, key, defaultValueOrParams, params)
  }

  const locale = computed((): LocaleCode => localeStore.locale)
  const availableLocales = computed((): Locale[] => localeStore.availableLocales)

  const changeLocale = async (newLocale: LocaleCode): Promise<void> => {
    await localeStore.changeLocale(newLocale)
  }

  const loading = computed((): boolean => localeStore.loading)
  const error = computed((): string | null => localeStore.error)
  const format = computed((): LocaleFormat | undefined => localeStore.localeFormat)

  return {
    t,
    tv,
    locale,
    availableLocales,
    changeLocale,
    loading,
    error,
    format,
  }
}
