import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { apiClient, isSecureUrl, HttpError } from '@/api/client';
import * as authModule from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import * as configModule from '@/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEB_API_ROOT = 'http://localhost:8080/WebAPI/';

const AUTH_PROVIDERS = [
  { name: 'db', url: 'user/login/db', ajax: true, icon: 'fa-database', isUse498: false },
  { name: 'ldap', url: 'user/login/ldap', ajax: true, icon: 'fa-cubes', isUse498: false },
];

const DEFAULT_CONFIG = {
  webAPIRoot: WEB_API_ROOT,
  userAuthenticationEnabled: true,
  authProviders: AUTH_PROVIDERS,
  api: { url: WEB_API_ROOT },
  refreshTokenThreshold: 1000 * 60 * 60 * 4,
  enableSkipLogin: false,
  disableBrowserCheck: false,
  showCompanyInfo: true,
};

/** Create a minimal JWT with the given payload */
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa('signature');
  return `${header}.${body}.${sig}`;
}

function mockFetchResponse(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = { 'Content-Type': 'application/json' },
): Response {
  const statusText =
    status === 200 ? 'OK' :
    status === 204 ? 'No Content' :
    status === 401 ? 'Unauthorized' :
    status === 403 ? 'Forbidden' :
    status === 404 ? 'Not Found' :
    'Error';
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/** Generates a safe URL path segment (alphanumeric + hyphens, 1-15 chars) */
const arbPathSegment = fc.string({
  unit: fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
  minLength: 1,
  maxLength: 15,
});

/** Generates a relative API path like "cohort/definition/123" */
const arbRelativePath = fc
  .array(arbPathSegment, { minLength: 1, maxLength: 4 })
  .map((segments) => segments.join('/'));

/** Auth provider URL paths from config */
const authProviderPaths = AUTH_PROVIDERS.map((p) => p.url);

/** Generates a secure URL (WebAPI root + path that is NOT an auth provider URL) */
const arbSecureRelativePath = arbRelativePath.filter(
  (p) => !authProviderPaths.includes(p),
);

/** Generates an external (non-secure) full URL */
const arbExternalUrl = arbRelativePath.map(
  (p) => `https://external.example.com/${p}`,
);

/** Generates a random token string (simulating a JWT) */
const arbToken = fc.record({
  sub: fc.string({ minLength: 1, maxLength: 20 }),
  exp: fc.integer({ min: Math.floor(Date.now() / 1000) + 3600, max: Math.floor(Date.now() / 1000) + 86400 }),
}).map((payload) => makeJwt(payload));

// ---------------------------------------------------------------------------
// Property 11: APIリクエストへの認証トークン自動付与
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 11: APIリクエストへの認証トークン自動付与', () => {
  /**
   * **Validates: Requirements 5.3**
   *
   * For random URL paths × token states, verify that:
   * - Secure URLs (under webAPIRoot, excluding auth provider URLs) get the Authorization header
   * - Non-secure URLs (external URLs) do NOT get the Authorization header
   */

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(configModule, 'getConfig').mockReturnValue(DEFAULT_CONFIG as any);
    useAuthStore.getState().resetAuthParams();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('secure URLs receive Authorization header when token is present', () => {
    fc.assert(
      fc.asyncProperty(arbSecureRelativePath, arbToken, async (path, token) => {
        // Set up auth state with a token
        vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue(`Bearer ${token}`);
        fetchSpy.mockResolvedValue(mockFetchResponse(200, { ok: true }));

        await apiClient.get(path);

        expect(fetchSpy).toHaveBeenCalledOnce();
        const [requestedUrl, init] = fetchSpy.mock.calls[0]!;

        // URL should be under webAPIRoot
        expect(requestedUrl).toBe(`${WEB_API_ROOT}${path}`);

        // Authorization header should be present
        expect(init.headers['Authorization']).toBe(`Bearer ${token}`);

        // Action-Location header should also be present for secure URLs
        expect(init.headers).toHaveProperty('Action-Location');

        fetchSpy.mockClear();
      }),
      { numRuns: 100 },
    );
  });

  it('secure URLs do NOT receive Authorization header when no token is set', () => {
    fc.assert(
      fc.asyncProperty(arbSecureRelativePath, async (path) => {
        // No token set
        vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue(null);
        fetchSpy.mockResolvedValue(mockFetchResponse(200, { ok: true }));

        await apiClient.get(path);

        expect(fetchSpy).toHaveBeenCalledOnce();
        const [, init] = fetchSpy.mock.calls[0]!;

        // Authorization header should NOT be present
        expect(init.headers['Authorization']).toBeUndefined();

        // Action-Location should still be present (secure URL)
        expect(init.headers).toHaveProperty('Action-Location');

        fetchSpy.mockClear();
      }),
      { numRuns: 100 },
    );
  });

  it('non-secure (external) URLs never receive Authorization header regardless of token state', () => {
    fc.assert(
      fc.asyncProperty(arbExternalUrl, arbToken, async (url, token) => {
        vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue(`Bearer ${token}`);
        fetchSpy.mockResolvedValue(mockFetchResponse(200, { ok: true }));

        await apiClient.get(url);

        expect(fetchSpy).toHaveBeenCalledOnce();
        const [, init] = fetchSpy.mock.calls[0]!;

        // Authorization header should NOT be present for external URLs
        expect(init.headers['Authorization']).toBeUndefined();

        // Action-Location should NOT be present for non-secure URLs
        expect(init.headers['Action-Location']).toBeUndefined();

        fetchSpy.mockClear();
      }),
      { numRuns: 100 },
    );
  });

  it('auth provider URLs do NOT receive Authorization header even though they are under webAPIRoot', () => {
    fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...authProviderPaths),
        arbToken,
        async (providerPath, token) => {
          vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue(`Bearer ${token}`);
          fetchSpy.mockResolvedValue(mockFetchResponse(200, { ok: true }));

          await apiClient.get(providerPath);

          expect(fetchSpy).toHaveBeenCalledOnce();
          const [requestedUrl, init] = fetchSpy.mock.calls[0]!;

          // URL should be under webAPIRoot
          expect(requestedUrl).toBe(`${WEB_API_ROOT}${providerPath}`);

          // isSecureUrl should return false for auth provider URLs
          expect(isSecureUrl(requestedUrl)).toBe(false);

          // Authorization header should NOT be present
          expect(init.headers['Authorization']).toBeUndefined();

          fetchSpy.mockClear();
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: 401レスポンス時の認証パラメータリセット
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 12: 401レスポンス時の認証パラメータリセット', () => {
  /**
   * **Validates: Requirements 5.4**
   *
   * For random API paths, when a 401 response is received,
   * auth params (token, subject, permissions) are reset to null.
   */

  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(configModule, 'getConfig').mockReturnValue(DEFAULT_CONFIG as any);
    vi.spyOn(authModule, 'refreshToken').mockResolvedValue(undefined);
    useAuthStore.getState().resetAuthParams();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('401 response resets token, subject, and permissions to null', () => {
    fc.assert(
      fc.asyncProperty(arbSecureRelativePath, arbToken, async (path, token) => {
        // Set up authenticated state
        vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue(`Bearer ${token}`);
        useAuthStore.setState({
          token,
          subject: 'testuser',
          permissions: { '*': ['*'] },
        });

        // Verify auth state is set
        expect(useAuthStore.getState().token).toBe(token);
        expect(useAuthStore.getState().subject).toBe('testuser');
        expect(useAuthStore.getState().permissions).not.toBeNull();

        // Mock 401 response
        fetchSpy.mockResolvedValue(mockFetchResponse(401, { error: 'Unauthorized' }));

        // Make request — should throw HttpError
        try {
          await apiClient.get(path);
          expect.unreachable('should have thrown HttpError');
        } catch (e) {
          expect(e).toBeInstanceOf(HttpError);
          expect((e as HttpError).status).toBe(401);
        }

        // Verify auth params are reset
        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.subject).toBeNull();
        expect(state.permissions).toBeNull();

        fetchSpy.mockClear();
      }),
      { numRuns: 100 },
    );
  });

  it('401 response resets auth regardless of the random auth state set before', () => {
    const arbAuthState = fc.record({
      token: arbToken,
      subject: fc.string({ minLength: 1, maxLength: 20 }),
      fullName: fc.string({ minLength: 1, maxLength: 30 }),
      authProvider: fc.constantFrom('db', 'ldap', 'google', 'saml'),
      authClient: fc.constantFrom('AUTH_CLIENT_SAML', 'AUTH_CLIENT_DB', null),
    });

    fc.assert(
      fc.asyncProperty(arbSecureRelativePath, arbAuthState, async (path, authState) => {
        // Set up random auth state
        vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue(`Bearer ${authState.token}`);
        useAuthStore.setState({
          token: authState.token,
          subject: authState.subject,
          fullName: authState.fullName,
          permissions: { cohortdefinition: ['cohortdefinition:*'] },
          authProvider: authState.authProvider,
          authClient: authState.authClient,
        });

        // Mock 401 response
        fetchSpy.mockResolvedValue(mockFetchResponse(401, { error: 'Unauthorized' }));

        try {
          await apiClient.get(path);
          expect.unreachable('should have thrown HttpError');
        } catch (e) {
          expect(e).toBeInstanceOf(HttpError);
        }

        // After 401, all auth params should be reset
        const state = useAuthStore.getState();
        expect(state.token).toBeNull();
        expect(state.subject).toBeNull();
        expect(state.fullName).toBeNull();
        expect(state.permissions).toBeNull();
        expect(state.authProvider).toBeNull();
        expect(state.authClient).toBeNull();
        expect(state.tokenExpired).toBe(false);
        expect(state.signInOpened).toBe(false);

        fetchSpy.mockClear();
      }),
      { numRuns: 100 },
    );
  });
});
