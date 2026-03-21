import type { AppConfig } from './types';

/**
 * Default application configuration.
 * Mirrors the defaults from the legacy js/config/app.js.
 */
const defaultConfig: AppConfig = {
  api: {
    url: '/WebAPI/',
  },
  userAuthenticationEnabled: false,
  authProviders: [],
  refreshTokenThreshold: 1000 * 60 * 60 * 4, // 4 hours
  enableSkipLogin: false,
  disableBrowserCheck: false,
  webAPIRoot: '/WebAPI/',
  showCompanyInfo: true,
};

let currentConfig: AppConfig = { ...defaultConfig };

/**
 * Load application configuration by merging defaults with:
 * 1. A runtime config object (e.g. fetched from a config file at startup)
 * 2. Vite environment variables (import.meta.env)
 *
 * Runtime config takes precedence over env vars, which take precedence over defaults.
 */
export function loadConfig(runtimeConfig?: Partial<AppConfig>): AppConfig {
  const envOverrides: Partial<AppConfig> = {};

  // Read Vite env vars (VITE_* prefix required by Vite)
  const envApiUrl = import.meta.env.VITE_WEBAPI_URL;
  if (envApiUrl) {
    envOverrides.api = { ...defaultConfig.api, url: envApiUrl };
    envOverrides.webAPIRoot = envApiUrl;
  }

  if (import.meta.env.VITE_USER_AUTH_ENABLED === 'true') {
    envOverrides.userAuthenticationEnabled = true;
  }

  if (import.meta.env.VITE_DISABLE_BROWSER_CHECK === 'true') {
    envOverrides.disableBrowserCheck = true;
  }

  if (import.meta.env.VITE_SKIP_LOGIN === 'true') {
    envOverrides.enableSkipLogin = true;
  }

  if (import.meta.env.VITE_SHOW_COMPANY_INFO === 'false') {
    envOverrides.showCompanyInfo = false;
  }

  // Merge: defaults <- env overrides <- runtime config
  currentConfig = {
    ...defaultConfig,
    ...envOverrides,
    ...runtimeConfig,
    api: {
      ...defaultConfig.api,
      ...envOverrides.api,
      ...runtimeConfig?.api,
    },
  };

  // Ensure webAPIRoot stays in sync with api.url
  currentConfig.webAPIRoot = currentConfig.api.url;

  return currentConfig;
}

/**
 * Get the current application configuration.
 * Call loadConfig() first during app initialization.
 */
export function getConfig(): AppConfig {
  return currentConfig;
}
