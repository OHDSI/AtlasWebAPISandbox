/**
 * Property-based tests for the internationalization (i18n) system.
 *
 * Feature: react-typescript-migration
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import i18n, { changeLanguage, addLocaleResource } from '@/i18n/index';
import en from '@/i18n/locales/en.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collect all leaf keys from a nested object, returning
 * dot-separated paths (e.g. "navigation.home", "errors.unauthorized").
 */
function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

/** All translation keys from the English locale file */
const ALL_KEYS = collectKeys(en);

/** Arbitrary that picks one of the existing translation keys */
const translationKeyArb = fc.constantFrom(...ALL_KEYS);

// ---------------------------------------------------------------------------
// Property 14: Translation key completeness
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 14: Translation key completeness', () => {
  /**
   * **Validates: Requirements 8.2**
   *
   * For every existing translation key, the i18n system returns a
   * non-empty translation string.
   */
  beforeEach(async () => {
    // Ensure we start from the default locale
    await i18n.changeLanguage('en');
  });

  it('should return a non-empty translation for every existing key', () => {
    fc.assert(
      fc.property(translationKeyArb, (key) => {
        const translation = i18n.t(key);
        // Translation must be a non-empty string
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
        // Translation must not equal the key itself (which would indicate a missing translation)
        expect(translation).not.toBe(key);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Locale switching round-trip
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 15: Locale switching round-trip', () => {
  /**
   * **Validates: Requirements 8.3**
   *
   * For any available locale, after switching to that locale,
   * `i18n.language` is correctly updated to match the target locale.
   */
  beforeEach(async () => {
    // Add a second locale so we can test switching between multiple locales
    addLocaleResource('ja', {
      navigation: { home: 'ホーム', vocabulary: '語彙' },
      common: { save: '保存', cancel: 'キャンセル' },
    });
  });

  const localeArb = fc.constantFrom('en', 'ja');

  it('should update i18n.language after switching locale', async () => {
    await fc.assert(
      fc.asyncProperty(localeArb, async (targetLocale) => {
        await changeLanguage(targetLocale);
        expect(i18n.language).toBe(targetLocale);
      }),
      { numRuns: 100 },
    );
  });

  it('should return translations for the active locale after switching', async () => {
    // Switch to Japanese and verify a known key
    await changeLanguage('ja');
    expect(i18n.t('navigation.home')).toBe('ホーム');

    // Switch back to English and verify
    await changeLanguage('en');
    expect(i18n.t('navigation.home')).toBe('Home');
  });
});
