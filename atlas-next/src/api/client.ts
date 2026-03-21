import { getConfig } from '@/config';
import { getAuthorizationHeader, refreshToken } from '@/api/auth';
import { useAuthStore } from '@/stores/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<T>(path: string, config?: RequestConfig): Promise<T>;
  post<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T>(path: string, config?: RequestConfig): Promise<T>;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body?: unknown,
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'HttpError';
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine whether a fully-qualified URL is "secure" (needs auth headers).
 *
 * A URL is secure when:
 *  1. It starts with the configured webAPIRoot, AND
 *  2. It is NOT one of the auth-provider URLs.
 *
 * This mirrors the legacy `isSecureUrl` in `js/services/http.js`.
 */
export function isSecureUrl(url: string): boolean {
  const config = getConfig();
  const apiRoot = config.webAPIRoot;

  if (!url.startsWith(apiRoot)) {
    return false;
  }

  const authProviderUrls = new Set(
    config.authProviders.map((p) => apiRoot + p.url),
  );

  return !authProviderUrls.has(url);
}

/**
 * Build the full URL from a path (which may be relative or absolute) and
 * optional query parameters.
 */
function buildUrl(path: string, params?: Record<string, string>): string {
  const config = getConfig();
  // If path is already absolute, use it as-is; otherwise prepend webAPIRoot
  const base = path.startsWith('http://') || path.startsWith('https://') ? path : config.webAPIRoot + path;

  if (!params || Object.keys(params).length === 0) {
    return base;
  }

  const qs = new URLSearchParams(params).toString();
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}${qs}`;
}

/**
 * Build the headers for a request.
 */
function buildHeaders(url: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Language': navigator.language ?? 'en',
    ...extra,
  };

  if (isSecureUrl(url)) {
    const authHeader = getAuthorizationHeader();
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    // Mirror legacy: send current page location for audit purposes
    headers['Action-Location'] = globalThis.location?.href ?? '';
  }

  return headers;
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/**
 * Handle HTTP errors according to the design doc error-handling table:
 *
 * | Status | Handling                                      |
 * |--------|-----------------------------------------------|
 * | 401    | Reset auth params, show login                 |
 * | 403    | Try token refresh                             |
 * | 404    | Set error message, show EmptyState            |
 * | 5xx    | Console error log, notify user                |
 */
async function handleResponseError(response: Response): Promise<never> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // body may not be JSON – that's fine
  }

  const { status, statusText } = response;

  switch (status) {
    case 401:
      // Reset auth params (mirrors legacy handleAccessDenied for 401)
      useAuthStore.getState().resetAuthParams();
      break;

    case 403:
      // Attempt a token refresh (mirrors legacy handleAccessDenied for 403)
      try {
        await refreshToken();
      } catch {
        // refresh failed – nothing more we can do here
      }
      break;

    case 404: {
      // Extract message from payload if available (legacy pattern)
      const payload = (body as { payload?: { message?: string } } | undefined)?.payload;
      if (payload?.message) {
        console.warn(`[API 404] ${payload.message}`);
      }
      break;
    }

    default:
      if (status >= 500) {
        console.error(`[API ${status}] Server error: ${statusText}`);
      }
      break;
  }

  throw new HttpError(status, statusText, body);
}

// ---------------------------------------------------------------------------
// Core request function
// ---------------------------------------------------------------------------

async function request<T>(
  method: string,
  path: string,
  data?: unknown,
  config?: RequestConfig,
): Promise<T> {
  const url = buildUrl(path, config?.params);
  const headers = buildHeaders(url, config?.headers);

  const init: RequestInit = {
    method,
    headers,
    signal: config?.signal,
  };

  if (data !== undefined && (method === 'POST' || method === 'PUT')) {
    init.body = JSON.stringify(data);
  }

  const response = await fetch(url, init);

  if (!response.ok) {
    return handleResponseError(response);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  // Fall back to text for non-JSON responses
  return (await response.text()) as unknown as T;
}

// ---------------------------------------------------------------------------
// Public API client singleton
// ---------------------------------------------------------------------------

export const apiClient: ApiClient = {
  get<T>(path: string, config?: RequestConfig): Promise<T> {
    return request<T>('GET', path, undefined, config);
  },

  post<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>('POST', path, data, config);
  },

  put<T>(path: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return request<T>('PUT', path, data, config);
  },

  delete<T>(path: string, config?: RequestConfig): Promise<T> {
    return request<T>('DELETE', path, undefined, config);
  },
};
