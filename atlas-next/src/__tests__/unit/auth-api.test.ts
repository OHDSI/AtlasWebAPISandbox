import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from '@/stores/auth';

// Mock getConfig
const mockConfig = {
  userAuthenticationEnabled: true,
  api: { url: 'http://localhost:8080/WebAPI/' },
  authProviders: [],
  refreshTokenThreshold: 1000 * 60 * 60 * 4,
  enableSkipLogin: false,
  disableBrowserCheck: false,
  webAPIRoot: 'http://localhost:8080/WebAPI/',
  showCompanyInfo: true,
};

vi.mock('@/config', () => ({
  getConfig: vi.fn(() => mockConfig),
}));

/** Helper: create a minimal JWT with the given payload */
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa('signature');
  return `${header}.${body}.${sig}`;
}

// Import after mocks are set up
import {
  loadUserInfo,
  refreshToken,
  getAuthorizationHeader,
  tokenExpirationDate,
  checkOAuthError,
  AUTH_PROVIDERS,
} from '@/api/auth';

describe('auth API service', () => {
  beforeEach(() => {
    useAuthStore.getState().resetAuthParams();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAuthorizationHeader', () => {
    it('returns null when no token is set', () => {
      expect(getAuthorizationHeader()).toBeNull();
    });

    it('returns "Bearer <token>" when token is set', () => {
      const token = makeJwt({ sub: 'user1' });
      useAuthStore.getState().setAuthParams(token);
      expect(getAuthorizationHeader()).toBe(`Bearer ${token}`);
    });
  });

  describe('tokenExpirationDate', () => {
    it('returns null when no token is set', () => {
      expect(tokenExpirationDate()).toBeNull();
    });

    it('returns the correct expiration date from JWT exp claim', () => {
      const expSeconds = 1700000000;
      const token = makeJwt({ sub: 'user1', exp: expSeconds });
      useAuthStore.getState().setAuthParams(token);

      const result = tokenExpirationDate();
      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBe(expSeconds * 1000);
    });

    it('returns current date for invalid JWT', () => {
      useAuthStore.setState({ token: 'invalid-jwt' });
      const before = Date.now();
      const result = tokenExpirationDate();
      const after = Date.now();

      expect(result).toBeInstanceOf(Date);
      expect(result!.getTime()).toBeGreaterThanOrEqual(before);
      expect(result!.getTime()).toBeLessThanOrEqual(after);
    });

    it('returns null when JWT has no exp claim', () => {
      const token = makeJwt({ sub: 'user1' });
      useAuthStore.getState().setAuthParams(token);
      expect(tokenExpirationDate()).toBeNull();
    });
  });

  describe('loadUserInfo', () => {
    it('updates store on successful response', async () => {
      const userInfo = {
        login: 'testuser',
        name: 'Test User',
        permissionIdx: { cohortdefinition: ['cohortdefinition:get'] },
      };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(userInfo),
        headers: new Headers({ 'x-auth-provider': 'StandardProvider' }),
      } as Response);

      await loadUserInfo();

      const state = useAuthStore.getState();
      expect(state.subject).toBe('testuser');
      expect(state.fullName).toBe('Test User');
      expect(state.permissions).toEqual(userInfo.permissionIdx);
      expect(state.authProvider).toBe('StandardProvider');
    });

    it('uses login as fullName when name is null', async () => {
      const userInfo = { login: 'testuser', name: null, permissionIdx: {} };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(userInfo),
        headers: new Headers(),
      } as Response);

      await loadUserInfo();
      expect(useAuthStore.getState().fullName).toBe('testuser');
    });

    it('clears subject on 401 response', async () => {
      useAuthStore.setState({ subject: 'olduser' });

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await loadUserInfo();
      expect(useAuthStore.getState().subject).toBeNull();
    });

    it('opens sign-in on 401 when enableSkipLogin is true', async () => {
      mockConfig.enableSkipLogin = true;

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await loadUserInfo();
      expect(useAuthStore.getState().signInOpened).toBe(true);

      mockConfig.enableSkipLogin = false;
    });

    it('injects IAP iframe when auth provider is IAP', async () => {
      const userInfo = { login: 'iapuser', name: 'IAP User', permissionIdx: {} };

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(userInfo),
        headers: new Headers({ 'x-auth-provider': AUTH_PROVIDERS.IAP }),
      } as Response);

      await loadUserInfo();

      expect(useAuthStore.getState().authProvider).toBe(AUTH_PROVIDERS.IAP);
      const iframe = document.getElementById('google-iap-refresher');
      expect(iframe).not.toBeNull();
      expect(iframe?.tagName).toBe('IFRAME');

      // Cleanup
      iframe?.remove();
    });
  });

  describe('refreshToken', () => {
    it('updates auth params on successful refresh', async () => {
      const token = makeJwt({ sub: 'user1' });
      useAuthStore.getState().setAuthParams(token);

      const newToken = makeJwt({ sub: 'user1', exp: 9999999999 });
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ permissions: '{"*":["*"]}' }),
        headers: new Headers({ Bearer: newToken }),
      } as Response);

      await refreshToken();

      const state = useAuthStore.getState();
      expect(state.token).toBe(newToken);
    });

    it('resets auth params on refresh failure', async () => {
      const token = makeJwt({ sub: 'user1' });
      useAuthStore.getState().setAuthParams(token);

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
        headers: new Headers(),
      } as Response);

      await refreshToken();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.subject).toBeNull();
    });

    it('is a no-op when auth is disabled', async () => {
      mockConfig.userAuthenticationEnabled = false;
      const fetchSpy = vi.spyOn(globalThis, 'fetch');

      await refreshToken();

      expect(fetchSpy).not.toHaveBeenCalled();
      mockConfig.userAuthenticationEnabled = true;
    });
  });

  describe('checkOAuthError', () => {
    it('shows alert when hash contains oauth_error_email', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const originalHash = window.location.hash;

      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: '#oauth_error_email' },
        writable: true,
      });

      checkOAuthError();
      expect(alertSpy).toHaveBeenCalledWith(
        'Empty email received from oauth server. Check whether it has public access'
      );

      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: originalHash },
        writable: true,
      });
    });

    it('does not show alert when hash does not contain oauth_error_email', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      Object.defineProperty(window, 'location', {
        value: { ...window.location, hash: '#some-other-hash' },
        writable: true,
      });

      checkOAuthError();
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });
});
