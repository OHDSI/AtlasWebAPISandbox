import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/hooks/useAuth';

// Helper: create a minimal JWT with the given payload
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa('signature');
  return `${header}.${body}.${sig}`;
}

const THRESHOLD = 1000 * 60 * 60 * 4; // 4 hours (default)

vi.mock('@/config', () => ({
  getConfig: vi.fn(() => ({
    userAuthenticationEnabled: true,
    api: { url: 'http://localhost:8080/WebAPI/' },
    authProviders: [],
    refreshTokenThreshold: THRESHOLD,
    enableSkipLogin: false,
    disableBrowserCheck: false,
    webAPIRoot: 'http://localhost:8080/WebAPI/',
    showCompanyInfo: true,
  })),
}));

// Mock refreshToken so we can track calls without network requests
const refreshTokenMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/api/auth', async () => {
  const actual = await vi.importActual<typeof import('@/api/auth')>('@/api/auth');
  return {
    ...actual,
    refreshToken: (...args: unknown[]) => refreshTokenMock(...args),
  };
});

function fireEvents(eventType: string, count: number) {
  for (let i = 0; i < count; i++) {
    window.dispatchEvent(new Event(eventType));
  }
}

describe('useAuth hook', () => {
  beforeEach(() => {
    useAuthStore.getState().resetAuthParams();
    refreshTokenMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not refresh when user is not authenticated', () => {
    renderHook(() => useAuth());

    // Fire 30 mouseover events to trigger a check
    fireEvents('mouseover', 30);

    expect(refreshTokenMock).not.toHaveBeenCalled();
  });

  it('does not refresh when token expiry is far in the future', () => {
    // Token expires in 10 hours (well above 4-hour threshold)
    const exp = Math.floor((Date.now() + 1000 * 60 * 60 * 10) / 1000);
    const token = makeJwt({ sub: 'user1', exp });
    useAuthStore.getState().setAuthParams(token);

    renderHook(() => useAuth());

    fireEvents('mouseover', 30);

    expect(refreshTokenMock).not.toHaveBeenCalled();
  });

  it('refreshes when token is close to expiring', () => {
    // Token expires in 1 hour (below 4-hour threshold)
    const exp = Math.floor((Date.now() + 1000 * 60 * 60 * 1) / 1000);
    const token = makeJwt({ sub: 'user1', exp });
    useAuthStore.getState().setAuthParams(token);

    renderHook(() => useAuth());

    fireEvents('keydown', 30);

    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
  });

  it('only checks every 30th interaction', () => {
    // Token expires in 1 hour (below threshold)
    const exp = Math.floor((Date.now() + 1000 * 60 * 60 * 1) / 1000);
    const token = makeJwt({ sub: 'user1', exp });
    useAuthStore.getState().setAuthParams(token);

    renderHook(() => useAuth());

    // Fire 29 events — should not trigger
    fireEvents('focusin', 29);
    expect(refreshTokenMock).not.toHaveBeenCalled();

    // 30th event triggers the check
    fireEvents('focusin', 1);
    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
  });

  it('responds to all three event types', () => {
    const exp = Math.floor((Date.now() + 1000 * 60 * 60 * 1) / 1000);
    const token = makeJwt({ sub: 'user1', exp });
    useAuthStore.getState().setAuthParams(token);

    renderHook(() => useAuth());

    // 10 of each event type = 30 total
    fireEvents('mouseover', 10);
    fireEvents('keydown', 10);
    fireEvents('focusin', 10);

    expect(refreshTokenMock).toHaveBeenCalledTimes(1);
  });

  it('cleans up event listeners on unmount', () => {
    const exp = Math.floor((Date.now() + 1000 * 60 * 60 * 1) / 1000);
    const token = makeJwt({ sub: 'user1', exp });
    useAuthStore.getState().setAuthParams(token);

    const { unmount } = renderHook(() => useAuth());
    unmount();

    // After unmount, events should not trigger refresh
    fireEvents('mouseover', 30);
    expect(refreshTokenMock).not.toHaveBeenCalled();
  });
});
