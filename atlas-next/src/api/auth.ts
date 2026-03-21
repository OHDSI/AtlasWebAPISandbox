import { getConfig } from '@/config';
import { useAuthStore, parseJwtPayload } from '@/stores/auth';

/**
 * Auth provider constants matching the legacy AuthAPI.js.
 */
export const AUTH_PROVIDERS = {
  IAP: 'AtlasGoogleSecurity',
} as const;

export const AUTH_CLIENTS = {
  SAML: 'AUTH_CLIENT_SAML',
} as const;

const TOKEN_HEADER = 'Bearer';

/**
 * Load user info from the WebAPI and update the auth store.
 *
 * Mirrors the legacy `loadUserInfo` in AuthAPI.js:
 * - GET {webAPIRoot}/user/me
 * - On success: set permissions, subject, authProvider, fullName
 * - On 401: clear subject, optionally open sign-in
 */
export async function loadUserInfo(): Promise<void> {
  const config = getConfig();
  const store = useAuthStore.getState();

  try {
    const response = await fetch(`${config.webAPIRoot}user/me`, {
      method: 'GET',
      headers: {
        ...(store.token ? { Authorization: `${TOKEN_HEADER} ${store.token}` } : {}),
      },
    });

    if (response.ok) {
      const info = await response.json();
      const authProvider = response.headers.get('x-auth-provider');

      useAuthStore.setState({
        permissions: info.permissionIdx ?? null,
        subject: info.login ?? null,
        fullName: info.name ? info.name : info.login ?? null,
        authProvider: authProvider ?? null,
      });

      // IAP auth provider: inject session refresher iframe
      if (authProvider === AUTH_PROVIDERS.IAP) {
        injectIapSessionRefresher();
      }
    } else if (response.status === 401) {
      console.log('User is not authed');
      useAuthStore.setState({ subject: null });
      if (config.enableSkipLogin) {
        useAuthStore.setState({ signInOpened: true });
      }
    } else {
      throw new Error(`Cannot retrieve user info: ${response.status}`);
    }
  } catch (error) {
    // Re-throw non-401 errors so callers can handle them
    if (error instanceof Error && error.message.startsWith('Cannot retrieve user info')) {
      throw error;
    }
    // Network errors etc.
    throw new Error('Cannot retrieve user info');
  }
}

/**
 * Refresh the auth token by calling the WebAPI refresh endpoint.
 *
 * Mirrors the legacy `refreshToken` in AuthAPI.js:
 * - GET {webAPIRoot}/user/refresh
 * - On success: update token and permissions from response
 * - On failure: reset auth params
 */
let refreshTokenPromise: Promise<void> | null = null;

export async function refreshToken(): Promise<void> {
  const config = getConfig();

  if (!config.userAuthenticationEnabled) {
    return;
  }

  // Deduplicate concurrent refresh calls
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const store = useAuthStore.getState();
      const response = await fetch(`${config.webAPIRoot}user/refresh`, {
        method: 'GET',
        headers: {
          ...(store.token ? { Authorization: `${TOKEN_HEADER} ${store.token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const data = await response.json();
      const tokenHeader = response.headers.get(TOKEN_HEADER);

      if (tokenHeader) {
        useAuthStore.getState().setAuthParams(tokenHeader, data.permissions);
      }
    } catch {
      useAuthStore.getState().resetAuthParams();
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
}

/**
 * Get the Authorization header value for API requests.
 * Returns "Bearer <token>" if a token exists, null otherwise.
 */
export function getAuthorizationHeader(): string | null {
  const { token } = useAuthStore.getState();
  if (!token) {
    return null;
  }
  return `${TOKEN_HEADER} ${token}`;
}

/**
 * Get the expiration date of the current JWT token.
 * Parses the `exp` claim from the JWT payload and returns it as a Date.
 * Returns null if no token is set.
 */
export function tokenExpirationDate(): Date | null {
  const { token } = useAuthStore.getState();
  if (!token) {
    return null;
  }

  try {
    const payload = parseJwtPayload(token);
    if (payload.exp == null) {
      return null;
    }
    return new Date(payload.exp * 1000);
  } catch {
    // If JWT parsing fails, return current date (token is effectively expired)
    return new Date();
  }
}

/**
 * Check the URL hash for OAuth error (empty email from OAuth server).
 * If found, alert the user.
 */
export function checkOAuthError(): void {
  const hash = window.location.hash;
  if (hash && hash.includes('oauth_error_email')) {
    alert('Empty email received from oauth server. Check whether it has public access');
  }
}

/**
 * Inject the Google IAP session refresher iframe into the document body.
 * This keeps the IAP session alive by periodically refreshing it.
 */
function injectIapSessionRefresher(): void {
  const id = 'google-iap-refresher';
  const existing = document.getElementById(id);
  if (existing) {
    existing.remove();
  }
  const iframe = document.createElement('iframe');
  iframe.id = id;
  iframe.src = '/_gcp_iap/session_refresher';
  iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;border:none;';
  document.body.appendChild(iframe);
}
