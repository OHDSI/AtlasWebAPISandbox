/**
 * Integration tests for the OHDSI Atlas React application.
 *
 * Validates:
 * - Route lazy loading (Requirements 2.1)
 * - Auth flow integration (Requirements 4.1)
 * - Dirty flag / unsaved changes warning (Requirements 3.3)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/auth';
import { loadConfig } from '@/config';
import { useDirtyFlag } from '@/hooks/useDirtyFlag';

// ---------------------------------------------------------------------------
// 1. Route lazy loading – verify all 17 page modules export a default component
// ---------------------------------------------------------------------------

describe('Route lazy loading', () => {
  const pageModules = [
    { name: 'Home', importFn: () => import('@/pages/Home') },
    { name: 'Vocabulary', importFn: () => import('@/pages/Vocabulary') },
    { name: 'CohortDefinitions', importFn: () => import('@/pages/CohortDefinitions') },
    { name: 'ConceptSets', importFn: () => import('@/pages/ConceptSets') },
    { name: 'Characterizations', importFn: () => import('@/pages/Characterizations') },
    { name: 'IncidenceRates', importFn: () => import('@/pages/IncidenceRates') },
    { name: 'Pathways', importFn: () => import('@/pages/Pathways') },
    { name: 'Estimation', importFn: () => import('@/pages/Estimation') },
    { name: 'Prediction', importFn: () => import('@/pages/Prediction') },
    { name: 'Profiles', importFn: () => import('@/pages/Profiles') },
    { name: 'Jobs', importFn: () => import('@/pages/Jobs') },
    { name: 'Configuration', importFn: () => import('@/pages/Configuration') },
    { name: 'DataSources', importFn: () => import('@/pages/DataSources') },
    { name: 'Feedback', importFn: () => import('@/pages/Feedback') },
    { name: 'Tools', importFn: () => import('@/pages/Tools') },
    { name: 'Reusables', importFn: () => import('@/pages/Reusables') },
    { name: 'Tagging', importFn: () => import('@/pages/Tagging') },
  ];

  it('should have exactly 17 page modules', () => {
    expect(pageModules).toHaveLength(17);
  });

  it.each(pageModules)(
    'should dynamically import $name and export a default component',
    async ({ importFn }) => {
      const mod = await importFn();
      expect(mod).toHaveProperty('default');
      expect(typeof mod.default).toBe('function');
    },
  );
});

// ---------------------------------------------------------------------------
// 2. Auth flow integration – login → access check → logout
// ---------------------------------------------------------------------------

describe('Auth flow integration', () => {
  // A minimal valid JWT (header.payload.signature) with sub and name claims
  const TEST_JWT = [
    btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    btoa(JSON.stringify({ sub: 'test-user', name: 'Test User', exp: 9999999999 })),
    'signature',
  ].join('.');

  beforeEach(() => {
    // Enable auth so isAuthenticated actually checks subject
    loadConfig({ userAuthenticationEnabled: true });
    // Reset store to unauthenticated state
    useAuthStore.getState().resetAuthParams();
  });

  it('should start unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.subject).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
  });

  it('should authenticate after setAuthParams and lose auth after resetAuthParams', () => {
    const store = useAuthStore.getState();

    // Login
    store.setAuthParams(TEST_JWT);
    const afterLogin = useAuthStore.getState();
    expect(afterLogin.token).toBe(TEST_JWT);
    expect(afterLogin.subject).toBe('test-user');
    expect(afterLogin.fullName).toBe('Test User');
    expect(afterLogin.isAuthenticated()).toBe(true);

    // Logout
    useAuthStore.getState().resetAuthParams();
    const afterLogout = useAuthStore.getState();
    expect(afterLogout.token).toBeNull();
    expect(afterLogout.subject).toBeNull();
    expect(afterLogout.isAuthenticated()).toBe(false);
  });

  it('should grant permission after login and deny after logout', () => {
    const permissions = JSON.stringify({ '*': ['*'] });

    useAuthStore.getState().setAuthParams(TEST_JWT, permissions);
    expect(useAuthStore.getState().isPermitted('cohortdefinition:put:123')).toBe(true);

    useAuthStore.getState().resetAuthParams();
    expect(useAuthStore.getState().isPermitted('cohortdefinition:put:123')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3. Dirty flag integration – unsaved changes detection
// ---------------------------------------------------------------------------

describe('Dirty flag integration', () => {
  it('should start clean, become dirty on change, and reset to clean', () => {
    const initial = { name: 'Cohort A', description: 'desc' };
    let currentValue = { ...initial };

    const { result, rerender } = renderHook(() => useDirtyFlag(currentValue));

    // Initially not dirty (no initial snapshot set yet)
    expect(result.current.isDirty).toBe(false);

    // Set the initial snapshot
    act(() => {
      result.current.setInitial(initial);
    });

    // Still clean – current matches initial
    rerender();
    expect(result.current.isDirty).toBe(false);

    // Mutate the current value
    currentValue = { name: 'Cohort B', description: 'desc' };
    rerender();
    expect(result.current.isDirty).toBe(true);

    // Reset – takes a snapshot of current value as new initial
    act(() => {
      result.current.reset();
    });
    rerender();
    expect(result.current.isDirty).toBe(false);
  });

  it('should detect deep changes in nested objects', () => {
    const initial = { items: [{ id: 1, value: 'a' }] };
    let currentValue: typeof initial = JSON.parse(JSON.stringify(initial));

    const { result, rerender } = renderHook(() => useDirtyFlag(currentValue));

    act(() => {
      result.current.setInitial(initial);
    });
    rerender();
    expect(result.current.isDirty).toBe(false);

    // Deep change
    currentValue = { items: [{ id: 1, value: 'b' }] };
    rerender();
    expect(result.current.isDirty).toBe(true);
  });
});
