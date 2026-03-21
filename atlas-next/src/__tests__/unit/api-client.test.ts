import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, isSecureUrl, HttpError } from '@/api/client';
import * as authModule from '@/api/auth';
import { useAuthStore } from '@/stores/auth';
import * as configModule from '@/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchResponse(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = { 'Content-Type': 'application/json' },
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : status === 401 ? 'Unauthorized' : status === 403 ? 'Forbidden' : status === 404 ? 'Not Found' : 'Error',
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
  } as unknown as Response;
}

const DEFAULT_CONFIG = {
  webAPIRoot: 'http://localhost:8080/WebAPI/',
  userAuthenticationEnabled: true,
  authProviders: [
    { name: 'db', url: 'user/login/db', ajax: true, icon: 'fa-database', isUse498: false },
  ],
  api: { url: 'http://localhost:8080/WebAPI/' },
  refreshTokenThreshold: 1000 * 60 * 60 * 4,
  enableSkipLogin: false,
  disableBrowserCheck: false,
  showCompanyInfo: true,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('isSecureUrl', () => {
  beforeEach(() => {
    vi.spyOn(configModule, 'getConfig').mockReturnValue(DEFAULT_CONFIG as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for a WebAPI URL that is not an auth provider', () => {
    expect(isSecureUrl('http://localhost:8080/WebAPI/cohortdefinition')).toBe(true);
  });

  it('returns false for an auth provider URL', () => {
    expect(isSecureUrl('http://localhost:8080/WebAPI/user/login/db')).toBe(false);
  });

  it('returns false for an external URL', () => {
    expect(isSecureUrl('https://example.com/api/data')).toBe(false);
  });
});

describe('apiClient', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(configModule, 'getConfig').mockReturnValue(DEFAULT_CONFIG as any);
    vi.spyOn(authModule, 'getAuthorizationHeader').mockReturnValue('Bearer test-token');
    vi.spyOn(authModule, 'refreshToken').mockResolvedValue(undefined);
    // Reset auth store
    useAuthStore.getState().resetAuthParams();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('GET: sends request with correct headers for secure URL', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(200, { id: 1 }));

    const result = await apiClient.get<{ id: number }>('cohortdefinition/1');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('http://localhost:8080/WebAPI/cohortdefinition/1');
    expect(init.method).toBe('GET');
    expect(init.headers['Authorization']).toBe('Bearer test-token');
    expect(init.headers['User-Language']).toBeDefined();
    expect(init.headers['Action-Location']).toBeDefined();
    expect(result).toEqual({ id: 1 });
  });

  it('GET: does not send auth headers for non-secure URL', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(200, { ok: true }));

    await apiClient.get<unknown>('https://external.com/api');

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.headers['Authorization']).toBeUndefined();
    expect(init.headers['Action-Location']).toBeUndefined();
  });

  it('POST: sends JSON body', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(200, { id: 2 }));

    const result = await apiClient.post<{ id: number }>('cohortdefinition', { name: 'test' });

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ name: 'test' }));
    expect(result).toEqual({ id: 2 });
  });

  it('PUT: sends JSON body', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(200, { updated: true }));

    await apiClient.put('cohortdefinition/1', { name: 'updated' });

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ name: 'updated' }));
  });

  it('DELETE: sends request without body', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(200, {}));

    await apiClient.delete('cohortdefinition/1');

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.method).toBe('DELETE');
    expect(init.body).toBeUndefined();
  });

  it('appends query params to URL', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(200, []));

    await apiClient.get('vocabulary/search', { params: { query: 'aspirin', limit: '10' } });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain('query=aspirin');
    expect(url).toContain('limit=10');
  });

  it('handles 204 No Content', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      headers: new Headers(),
      json: () => Promise.reject(new Error('no body')),
      text: () => Promise.resolve(''),
    } as unknown as Response);

    const result = await apiClient.delete('cohortdefinition/1');
    expect(result).toBeUndefined();
  });

  // Error handling tests
  it('401: resets auth params', async () => {
    // Set some auth state first
    useAuthStore.getState().setAuthParams('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjo5OTk5OTk5OTk5fQ.sig');

    fetchSpy.mockResolvedValue(mockFetchResponse(401, { error: 'Unauthorized' }));

    await expect(apiClient.get('user/me')).rejects.toThrow(HttpError);
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('403: attempts token refresh', async () => {
    fetchSpy.mockResolvedValue(mockFetchResponse(403, { error: 'Forbidden' }));

    await expect(apiClient.get('cohortdefinition/1')).rejects.toThrow(HttpError);
    expect(authModule.refreshToken).toHaveBeenCalledOnce();
  });

  it('404: throws HttpError with body', async () => {
    const body = { payload: { message: 'Cohort not found' } };
    fetchSpy.mockResolvedValue(mockFetchResponse(404, body));

    try {
      await apiClient.get('cohortdefinition/999');
      expect.unreachable('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      expect((e as HttpError).status).toBe(404);
      expect((e as HttpError).body).toEqual(body);
    }
  });

  it('500: logs error and throws HttpError', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockResolvedValue(mockFetchResponse(500, { error: 'Internal Server Error' }));

    await expect(apiClient.get('source')).rejects.toThrow(HttpError);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('passes AbortSignal through', async () => {
    const controller = new AbortController();
    fetchSpy.mockResolvedValue(mockFetchResponse(200, {}));

    await apiClient.get('test', { signal: controller.signal });

    const [, init] = fetchSpy.mock.calls[0]!;
    expect(init.signal).toBe(controller.signal);
  });
});
