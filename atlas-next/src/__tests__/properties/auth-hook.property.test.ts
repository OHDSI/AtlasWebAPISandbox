import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { renderHook } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth';
import { useAuth } from '@/hooks/useAuth';

// Track refreshToken calls
const refreshTokenMock = vi.fn();

vi.mock('@/api/auth', () => ({
  tokenExpirationDate: vi.fn(),
  refreshToken: (...args: unknown[]) => refreshTokenMock(...args),
}));

vi.mock('@/config', () => ({
  getConfig: vi.fn(() => ({
    userAuthenticationEnabled: true,
    api: { url: 'http://localhost:8080/WebAPI/' },
    authProviders: [],
    refreshTokenThreshold: 0, // Will be overridden per test via mock
    enableSkipLogin: false,
    disableBrowserCheck: false,
    webAPIRoot: 'http://localhost:8080/WebAPI/',
    showCompanyInfo: true,
  })),
}));

// We need dynamic control over getConfig and tokenExpirationDate
import { getConfig } from '@/config';
import { tokenExpirationDate } from '@/api/auth';

const getConfigMock = vi.mocked(getConfig);
const tokenExpirationDateMock = vi.mocked(tokenExpirationDate);

/** Helper: create a minimal JWT with the given payload */
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  const sig = btoa('signature');
  return `${header}.${body}.${sig}`;
}

/** Fire 30 interaction events to trigger the refresh check */
function fire30Events(): void {
  for (let i = 0; i < 30; i++) {
    window.dispatchEvent(new Event('mouseover'));
  }
}

describe('Feature: react-typescript-migration, Property 8: トークン有効期限に基づく自動リフレッシュ', () => {
  /**
   * **Validates: Requirements 4.2**
   *
   * For random JWT token expiration times and threshold values,
   * verify that after 30 interaction events:
   * - If (expDate - now) <= threshold → refreshToken is called
   * - If (expDate - now) > threshold → refreshToken is NOT called
   */

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.getState().resetAuthParams();

    // Set up an authenticated user with a valid token
    const token = makeJwt({ sub: 'testuser', exp: Math.floor(Date.now() / 1000) + 3600 });
    useAuthStore.setState({
      token,
      subject: 'testuser',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls refreshToken when remaining time is within threshold', () => {
    fc.assert(
      fc.property(
        // Generate expiration offset in ms: 0 to 4 hours from now (within threshold range)
        fc.integer({ min: 0, max: 1000 * 60 * 60 * 4 }),
        // Generate threshold in ms: must be >= offset so refresh triggers
        fc.integer({ min: 0, max: 1000 * 60 * 60 * 8 }),
        (offsetMs, thresholdMs) => {
          // Ensure threshold >= offset so the condition (timeToExpire <= threshold) is met
          const effectiveThreshold = Math.max(offsetMs, thresholdMs);

          vi.clearAllMocks();

          const expDate = new Date(Date.now() + offsetMs);
          tokenExpirationDateMock.mockReturnValue(expDate);
          getConfigMock.mockReturnValue({
            userAuthenticationEnabled: true,
            api: { url: 'http://localhost:8080/WebAPI/' },
            authProviders: [],
            refreshTokenThreshold: effectiveThreshold,
            enableSkipLogin: false,
            disableBrowserCheck: false,
            webAPIRoot: 'http://localhost:8080/WebAPI/',
            showCompanyInfo: true,
          });

          const { unmount } = renderHook(() => useAuth());
          fire30Events();
          unmount();

          expect(refreshTokenMock).toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('does NOT call refreshToken when remaining time exceeds threshold', () => {
    fc.assert(
      fc.property(
        // Generate threshold in ms: 1ms to 2 hours
        fc.integer({ min: 1, max: 1000 * 60 * 60 * 2 }),
        // Generate extra time beyond threshold: 1ms to 4 hours
        fc.integer({ min: 1, max: 1000 * 60 * 60 * 4 }),
        (thresholdMs, extraMs) => {
          vi.clearAllMocks();

          // Expiration is threshold + extra beyond now, so timeToExpire > threshold
          const expDate = new Date(Date.now() + thresholdMs + extraMs);
          tokenExpirationDateMock.mockReturnValue(expDate);
          getConfigMock.mockReturnValue({
            userAuthenticationEnabled: true,
            api: { url: 'http://localhost:8080/WebAPI/' },
            authProviders: [],
            refreshTokenThreshold: thresholdMs,
            enableSkipLogin: false,
            disableBrowserCheck: false,
            webAPIRoot: 'http://localhost:8080/WebAPI/',
            showCompanyInfo: true,
          });

          const { unmount } = renderHook(() => useAuth());
          fire30Events();
          unmount();

          expect(refreshTokenMock).not.toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});
