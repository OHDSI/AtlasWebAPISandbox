import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, parseJwtPayload, parsePermissions, checkPermission } from '@/stores/auth';

// Mock getConfig to control userAuthenticationEnabled
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

describe('parseJwtPayload', () => {
  it('parses a valid JWT and returns the payload', () => {
    const token = makeJwt({ sub: 'user1', name: 'Test User', exp: 9999999999 });
    const payload = parseJwtPayload(token);
    expect(payload.sub).toBe('user1');
    expect(payload.name).toBe('Test User');
    expect(payload.exp).toBe(9999999999);
  });

  it('throws for a token with wrong number of parts', () => {
    expect(() => parseJwtPayload('only.two')).toThrow('JSON Web Token must have three parts');
    expect(() => parseJwtPayload('one')).toThrow('JSON Web Token must have three parts');
  });
});

describe('parsePermissions', () => {
  it('parses a JSON string into a PermissionIndex', () => {
    const json = '{"cohortdefinition":["cohortdefinition:get","cohortdefinition:post"]}';
    const result = parsePermissions(json);
    expect(result).toEqual({ cohortdefinition: ['cohortdefinition:get', 'cohortdefinition:post'] });
  });

  it('returns an object as-is', () => {
    const obj = { '*': ['*'] };
    expect(parsePermissions(obj)).toBe(obj);
  });
});

describe('checkPermission (Apache Shiro wildcard matching)', () => {
  it('returns true for exact match', () => {
    expect(checkPermission('cohortdefinition:get', 'cohortdefinition:get')).toBe(true);
  });

  it('returns true when etalon has wildcard at matching level', () => {
    expect(checkPermission('cohortdefinition:get', 'cohortdefinition:*')).toBe(true);
    expect(checkPermission('cohortdefinition:put:123', 'cohortdefinition:*:*')).toBe(true);
  });

  it('returns true when etalon has fewer parts (implies all)', () => {
    expect(checkPermission('cohortdefinition:get:123', 'cohortdefinition:get')).toBe(true);
  });

  it('returns false when etalon has more parts without wildcards', () => {
    expect(checkPermission('cohortdefinition', 'cohortdefinition:get')).toBe(false);
  });

  it('returns true when etalon has more parts that are all wildcards', () => {
    expect(checkPermission('cohortdefinition', 'cohortdefinition:*')).toBe(true);
    expect(checkPermission('cohortdefinition', 'cohortdefinition:*:*')).toBe(true);
  });

  it('handles comma-separated OR values in etalon', () => {
    expect(checkPermission('cohortdefinition:get', 'cohortdefinition:get,put')).toBe(true);
    expect(checkPermission('cohortdefinition:put', 'cohortdefinition:get,put')).toBe(true);
    expect(checkPermission('cohortdefinition:delete', 'cohortdefinition:get,put')).toBe(false);
  });

  it('handles comma-separated OR values in permission', () => {
    expect(checkPermission('cohortdefinition:get,put', 'cohortdefinition:get,put')).toBe(true);
    expect(checkPermission('cohortdefinition:get,put', 'cohortdefinition:*')).toBe(true);
    // Both parts of the permission must be in the etalon
    expect(checkPermission('cohortdefinition:get,put', 'cohortdefinition:get')).toBe(false);
  });

  it('returns false for null/empty inputs', () => {
    expect(checkPermission('', 'cohortdefinition:get')).toBe(false);
    expect(checkPermission('cohortdefinition:get', '')).toBe(false);
  });

  it('handles global wildcard', () => {
    expect(checkPermission('anything:here', '*')).toBe(true);
    expect(checkPermission('a:b:c', '*:*:*')).toBe(true);
  });
});

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().resetAuthParams();
  });

  describe('initial state', () => {
    it('has null/false defaults', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.subject).toBeNull();
      expect(state.fullName).toBeNull();
      expect(state.permissions).toBeNull();
      expect(state.authProvider).toBeNull();
      expect(state.authClient).toBeNull();
      expect(state.tokenExpired).toBe(false);
      expect(state.signInOpened).toBe(false);
    });
  });

  describe('setAuthParams', () => {
    it('sets token and extracts subject/fullName from JWT', () => {
      const token = makeJwt({ sub: 'admin', name: 'Admin User', exp: 9999999999 });
      useAuthStore.getState().setAuthParams(token);

      const state = useAuthStore.getState();
      expect(state.token).toBe(token);
      expect(state.subject).toBe('admin');
      expect(state.fullName).toBe('Admin User');
    });

    it('sets permissions when provided as JSON string', () => {
      const token = makeJwt({ sub: 'user1' });
      const perms = JSON.stringify({ cohortdefinition: ['cohortdefinition:get'] });
      useAuthStore.getState().setAuthParams(token, perms);

      const state = useAuthStore.getState();
      expect(state.permissions).toEqual({ cohortdefinition: ['cohortdefinition:get'] });
    });

    it('handles invalid JWT gracefully (still sets token)', () => {
      useAuthStore.getState().setAuthParams('not-a-valid-jwt');
      const state = useAuthStore.getState();
      expect(state.token).toBe('not-a-valid-jwt');
      expect(state.subject).toBeNull();
    });
  });

  describe('resetAuthParams', () => {
    it('resets all auth fields to null/false', () => {
      const token = makeJwt({ sub: 'user1', name: 'User' });
      useAuthStore.getState().setAuthParams(token, '{"*":["*"]}');
      useAuthStore.setState({ authProvider: 'google', authClient: 'saml', tokenExpired: true, signInOpened: true });

      useAuthStore.getState().resetAuthParams();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.subject).toBeNull();
      expect(state.fullName).toBeNull();
      expect(state.permissions).toBeNull();
      expect(state.authProvider).toBeNull();
      expect(state.authClient).toBeNull();
      expect(state.tokenExpired).toBe(false);
      expect(state.signInOpened).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no subject is set', () => {
      expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    });

    it('returns true when subject is set', () => {
      const token = makeJwt({ sub: 'user1' });
      useAuthStore.getState().setAuthParams(token);
      expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    });
  });

  describe('isPermitted', () => {
    it('returns false when no permissions are set', () => {
      expect(useAuthStore.getState().isPermitted('cohortdefinition:get')).toBe(false);
    });

    it('returns true for matching permission', () => {
      const token = makeJwt({ sub: 'user1' });
      const perms = JSON.stringify({ cohortdefinition: ['cohortdefinition:get', 'cohortdefinition:post'] });
      useAuthStore.getState().setAuthParams(token, perms);

      expect(useAuthStore.getState().isPermitted('cohortdefinition:get')).toBe(true);
      expect(useAuthStore.getState().isPermitted('cohortdefinition:post')).toBe(true);
    });

    it('returns false for non-matching permission', () => {
      const token = makeJwt({ sub: 'user1' });
      const perms = JSON.stringify({ cohortdefinition: ['cohortdefinition:get'] });
      useAuthStore.getState().setAuthParams(token, perms);

      expect(useAuthStore.getState().isPermitted('cohortdefinition:delete')).toBe(false);
    });

    it('checks global wildcard permissions from "*" key', () => {
      const token = makeJwt({ sub: 'admin' });
      const perms = JSON.stringify({ '*': ['*'] });
      useAuthStore.getState().setAuthParams(token, perms);

      expect(useAuthStore.getState().isPermitted('cohortdefinition:get')).toBe(true);
      expect(useAuthStore.getState().isPermitted('anything:here:123')).toBe(true);
    });

    it('handles complex permission patterns', () => {
      const token = makeJwt({ sub: 'user1' });
      const perms = JSON.stringify({
        cohortdefinition: ['cohortdefinition:*', 'cohortdefinition:123:put'],
        source: ['source:mySource:access'],
      });
      useAuthStore.getState().setAuthParams(token, perms);

      expect(useAuthStore.getState().isPermitted('cohortdefinition:get')).toBe(true);
      expect(useAuthStore.getState().isPermitted('cohortdefinition:put:456')).toBe(true);
      expect(useAuthStore.getState().isPermitted('source:mySource:access')).toBe(true);
      expect(useAuthStore.getState().isPermitted('source:otherSource:access')).toBe(false);
    });
  });
});
