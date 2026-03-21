import { describe, it, expect, beforeEach } from 'vitest';
import { loadConfig, getConfig } from '../../config';

describe('config', () => {
  beforeEach(() => {
    // Reset to defaults before each test
    loadConfig();
  });

  describe('getConfig', () => {
    it('returns default config when loadConfig has not been called with overrides', () => {
      const config = getConfig();
      expect(config.api.url).toBe('http://localhost:8080/WebAPI/');
      expect(config.webAPIRoot).toBe('http://localhost:8080/WebAPI/');
      expect(config.userAuthenticationEnabled).toBe(false);
      expect(config.authProviders).toEqual([]);
      expect(config.refreshTokenThreshold).toBe(1000 * 60 * 60 * 4);
      expect(config.enableSkipLogin).toBe(false);
      expect(config.disableBrowserCheck).toBe(false);
      expect(config.showCompanyInfo).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('merges runtime config over defaults', () => {
      const config = loadConfig({
        userAuthenticationEnabled: true,
        enableSkipLogin: true,
      });
      expect(config.userAuthenticationEnabled).toBe(true);
      expect(config.enableSkipLogin).toBe(true);
      // Defaults preserved for unset fields
      expect(config.disableBrowserCheck).toBe(false);
    });

    it('merges nested api config correctly', () => {
      const config = loadConfig({
        api: { url: 'https://example.com/WebAPI/' },
      });
      expect(config.api.url).toBe('https://example.com/WebAPI/');
      expect(config.webAPIRoot).toBe('https://example.com/WebAPI/');
    });

    it('keeps webAPIRoot in sync with api.url', () => {
      const config = loadConfig({
        api: { url: 'https://custom.api/v1/' },
        webAPIRoot: 'should-be-overridden',
      });
      expect(config.webAPIRoot).toBe('https://custom.api/v1/');
    });

    it('merges authProviders from runtime config', () => {
      const providers = [
        { name: 'Google', url: 'user/oauth/google', ajax: false, icon: 'fab fa-google', isUse498: false },
      ];
      const config = loadConfig({ authProviders: providers });
      expect(config.authProviders).toEqual(providers);
    });

    it('returns the same config via getConfig after loading', () => {
      const loaded = loadConfig({ disableBrowserCheck: true });
      const retrieved = getConfig();
      expect(retrieved).toEqual(loaded);
      expect(retrieved.disableBrowserCheck).toBe(true);
    });
  });
});
