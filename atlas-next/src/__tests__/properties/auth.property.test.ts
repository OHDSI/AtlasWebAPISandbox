import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useAuthStore, checkPermission } from '@/stores/auth';

// Mock getConfig to return userAuthenticationEnabled: true
vi.mock('@/config', () => ({
  getConfig: vi.fn(() => ({
    userAuthenticationEnabled: true,
    api: { url: 'http://localhost:8080/WebAPI/' },
    authProviders: [],
    refreshTokenThreshold: 1000 * 60 * 60 * 4,
    enableSkipLogin: false,
    disableBrowserCheck: false,
    webAPIRoot: 'http://localhost:8080/WebAPI/',
    showCompanyInfo: true,
  })),
}));

/** Helper: create a minimal JWT with the given payload */
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa('signature');
  return `${header}.${body}.${sig}`;
}

/**
 * Arbitrary: generates a single permission segment (alphanumeric lowercase, 1-12 chars)
 */
const arbSegment = fc.string({
  unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
  minLength: 1,
  maxLength: 12,
});

/**
 * Arbitrary: generates a single permission part — either a concrete segment or wildcard "*"
 */
const arbPart = fc.oneof(arbSegment, fc.constant('*'));

/**
 * Arbitrary: generates a colon-separated permission string with 1-4 parts
 */
const arbPermissionString = fc
  .array(arbPart, { minLength: 1, maxLength: 4 })
  .map((parts) => parts.join(':'));

/**
 * Arbitrary: generates a permission index (Record<string, string[]>)
 * with 1-5 keys, each having 1-5 etalon permission strings
 */
const arbPermissionIndex = fc
  .array(
    fc.tuple(
      fc.oneof(arbSegment, fc.constant('*')),
      fc.array(arbPermissionString, { minLength: 1, maxLength: 5 }),
    ),
    { minLength: 1, maxLength: 5 },
  )
  .map((entries) => Object.fromEntries(entries) as Record<string, string[]>);

describe('Feature: react-typescript-migration, Property 9: ワイルドカード権限チェック', () => {
  /**
   * **Validates: Requirements 4.5**
   *
   * For random permission strings and permission indexes, verify that
   * isPermitted behaves correctly with respect to wildcard matching:
   * - A wildcard `*` at any level matches everything
   * - Exact matches work
   * - Non-matching permissions return false
   */

  beforeEach(() => {
    useAuthStore.getState().resetAuthParams();
  });

  it('wildcard "*" etalon at any level matches all permissions at that level', () => {
    fc.assert(
      fc.property(arbPermissionString, (permission) => {
        // A global wildcard "*" should match any permission
        expect(checkPermission(permission, '*')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('exact match always returns true', () => {
    fc.assert(
      fc.property(arbPermissionString, (permission) => {
        // A permission should always match itself exactly
        expect(checkPermission(permission, permission)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('non-matching permissions return false when no wildcards are involved', () => {
    // Generate two distinct non-wildcard single-segment permissions
    const arbDistinctSegments = fc
      .tuple(arbSegment, arbSegment)
      .filter(([a, b]) => a !== b);

    fc.assert(
      fc.property(arbDistinctSegments, ([segA, segB]) => {
        // Two different single-segment permissions with no wildcards should not match
        expect(checkPermission(segA, segB)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('isPermitted correctly uses permission index with wildcard and exact matching', () => {
    fc.assert(
      fc.property(arbPermissionIndex, arbPermissionString, (permIdx, permission) => {
        const token = makeJwt({ sub: 'testuser' });
        useAuthStore.getState().resetAuthParams();
        useAuthStore.getState().setAuthParams(token, JSON.stringify(permIdx));

        const result = useAuthStore.getState().isPermitted(permission);

        // Compute expected result: check against etalons from '*' key and first-segment key
        const firstPart = permission.split(':')[0]!;
        const etalons = [...(permIdx['*'] ?? []), ...(permIdx[firstPart] ?? [])];
        const expected = etalons.some((etalon) => checkPermission(permission, etalon));

        expect(result).toBe(expected);
      }),
      { numRuns: 100 },
    );
  });

  it('etalon with fewer parts implies permission (Shiro rule)', () => {
    // If etalon has fewer colon-separated parts, everything beyond is implied
    const arbMultiPartPermission = fc
      .array(arbSegment, { minLength: 2, maxLength: 4 })
      .map((parts) => parts.join(':'));

    fc.assert(
      fc.property(arbMultiPartPermission, (permission) => {
        const parts = permission.split(':');
        // Use only the first part as etalon — should imply all deeper levels
        const etalon = parts[0]!;
        expect(checkPermission(permission, etalon)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});


describe('Feature: react-typescript-migration, Property 10: セッション無効化時の認証リセット', () => {
  /**
   * **Validates: Requirements 4.6**
   *
   * For random auth state, after calling resetAuthParams, all parameters
   * should be null/false.
   */

  beforeEach(() => {
    useAuthStore.getState().resetAuthParams();
  });

  /**
   * Arbitrary: generates a random auth state with random values for all fields
   */
  const arbAuthState = fc.record({
    token: fc.string({ minLength: 1, maxLength: 50 }),
    subject: fc.string({ minLength: 1, maxLength: 30 }),
    fullName: fc.string({ minLength: 1, maxLength: 50 }),
    permissions: arbPermissionIndex,
    authProvider: fc.string({ minLength: 1, maxLength: 20 }),
    authClient: fc.string({ minLength: 1, maxLength: 20 }),
    tokenExpired: fc.boolean(),
    signInOpened: fc.boolean(),
  });

  it('resetAuthParams resets all fields to null/false regardless of prior state', () => {
    fc.assert(
      fc.property(arbAuthState, (authState) => {
        // Set random auth state directly via setState
        useAuthStore.setState({
          token: authState.token,
          subject: authState.subject,
          fullName: authState.fullName,
          permissions: authState.permissions,
          authProvider: authState.authProvider,
          authClient: authState.authClient,
          tokenExpired: authState.tokenExpired,
          signInOpened: authState.signInOpened,
        });

        // Verify state was set (at least token should be non-null)
        expect(useAuthStore.getState().token).toBe(authState.token);

        // Call resetAuthParams
        useAuthStore.getState().resetAuthParams();

        // Verify all fields are reset
        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.subject).toBeNull();
        expect(state.fullName).toBeNull();
        expect(state.permissions).toBeNull();
        expect(state.authProvider).toBeNull();
        expect(state.authClient).toBeNull();
        expect(state.tokenExpired).toBe(false);
        expect(state.signInOpened).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('isAuthenticated returns false after resetAuthParams', () => {
    fc.assert(
      fc.property(arbAuthState, (authState) => {
        // Set random state
        useAuthStore.setState({
          token: authState.token,
          subject: authState.subject,
          fullName: authState.fullName,
          permissions: authState.permissions,
          authProvider: authState.authProvider,
          authClient: authState.authClient,
          tokenExpired: authState.tokenExpired,
          signInOpened: authState.signInOpened,
        });

        // Reset
        useAuthStore.getState().resetAuthParams();

        // With userAuthenticationEnabled: true, isAuthenticated should be false
        // because subject is null after reset
        expect(useAuthStore.getState().isAuthenticated()).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it('isPermitted returns false for any permission after resetAuthParams', () => {
    fc.assert(
      fc.property(arbAuthState, arbPermissionString, (authState, permission) => {
        // Set random state
        useAuthStore.setState({
          token: authState.token,
          subject: authState.subject,
          fullName: authState.fullName,
          permissions: authState.permissions,
          authProvider: authState.authProvider,
          authClient: authState.authClient,
          tokenExpired: authState.tokenExpired,
          signInOpened: authState.signInOpened,
        });

        // Reset
        useAuthStore.getState().resetAuthParams();

        // After reset, permissions is null, so isPermitted should always return false
        expect(useAuthStore.getState().isPermitted(permission)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
