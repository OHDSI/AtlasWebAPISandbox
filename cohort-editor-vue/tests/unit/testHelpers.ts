/**
 * Test Utilities for JSON Validation
 *
 * Provides helper functions for loading and validating JSON files
 * against Zod schemas in test suites.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { computed, ref } from 'vue'
import type { ZodSchema } from 'zod'
import type { Locale, LocaleCode, LocaleFormat, TranslationParams, UseI18nReturn } from '@/types/i18n'

/**
 * Load a JSON file from the test resources directory
 *
 * @param filename - Name of the JSON file (relative to tests/resources)
 * @param baseDir - Optional base directory path (defaults to __dirname/../resources)
 * @returns Parsed JSON object
 * @throws Error if file not found or JSON is invalid
 *
 * @example
 * const cohort = loadJsonResource('cohort-expressions/simple-condition.json')
 */
export function loadJsonResource(filename: string, baseDir?: string): any {
  const resourcesDir = baseDir || resolve(__dirname, '../resources')
  const filePath = resolve(resourcesDir, filename)

  try {
    const content = readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load JSON resource '${filename}': ${error.message}`)
    }
    throw error
  }
}

/**
 * Validate JSON against a Zod schema using safeParse
 *
 * @param json - JSON object to validate
 * @param schema - Zod schema to validate against
 * @returns Zod SafeParseReturnType with success flag and data/error
 *
 * @example
 * const result = validateJson(json, CohortExpressionSchema)
 * if (result.success) {
 *   console.log('Valid:', result.data)
 * } else {
 *   console.log('Errors:', result.error.issues)
 * }
 */
export function validateJson<T>(json: any, schema: ZodSchema) {
  return schema.safeParse(json) as ReturnType<typeof schema.safeParse>
}

/**
 * Validate JSON and throw on error
 *
 * Useful for setup/fixture loading where you want to fail fast
 *
 * @param json - JSON object to validate
 * @param schema - Zod schema to validate against
 * @returns Validated data
 * @throws Zod validation error if invalid
 *
 * @example
 * const cohort = validateJsonOrThrow(json, CohortExpressionSchema)
 */
export function validateJsonOrThrow<T>(json: any, schema: ZodSchema): T {
  const result = schema.safeParse(json)
  if (!result.success) {
    throw result.error
  }
  return result.data as T
}

/**
 * Load and validate a JSON resource file in one step
 *
 * Combines loading and validation for convenience
 *
 * @param filename - Name of the JSON file
 * @param schema - Zod schema to validate against
 * @param options - Optional configuration
 * @returns Validation result with data or errors
 *
 * @example
 * const result = loadAndValidateResource(
 *   'cohort-expressions/simple-condition.json',
 *   CohortExpressionSchema
 * )
 * if (!result.success) {
 *   console.log('Validation failed:', result.error.issues)
 * }
 */
export function loadAndValidateResource<T>(
  filename: string,
  schema: ZodSchema,
  options?: { baseDir?: string }
) {
  const json = loadJsonResource(filename, options?.baseDir)
  return validateJson<T>(json, schema)
}

export function createI18nKeyOnlyMock(locale: LocaleCode = 'en'): UseI18nReturn {
  const currentLocale = ref<LocaleCode>(locale)
  const loadingRef = ref(false)
  const errorRef = ref<string | null>(null)

  function getKeyOnlyTranslation(key: string): string {
    return `i18n:${key}`
  }

  const format = computed((): LocaleFormat | undefined => ({
    date: {
      datetime: 'MM/DD/YYYY HH:mm',
      datetimeWithSeconds: 'MM/DD/YYYY HH:mm:ss',
      dateOnly: 'MM/DD/YYYY',
      timeOnly: 'HH:mm',
    },
    number: { decimal: '.', thousands: ',', grouping: [3] },
  }))

  return {
    t: (key: string, _defaultValueOrParams?: string | TranslationParams, _params?: TranslationParams) =>
      computed(() => getKeyOnlyTranslation(key)),
    tv: (key: string, _defaultValueOrParams?: string | TranslationParams, _params?: TranslationParams) =>
      getKeyOnlyTranslation(key),
    locale: computed(() => currentLocale.value),
    availableLocales: computed((): Locale[] => [{ code: 'en', name: 'English' }]),
    changeLocale: async (newLocale: LocaleCode): Promise<void> => {
      currentLocale.value = newLocale
    },
    loading: computed(() => loadingRef.value),
    error: computed(() => errorRef.value),
    format,
  }
}

export const mockUseI18nKeyOnly = {
  useI18n: () => createI18nKeyOnlyMock(),
}
