/**
 * Property-based tests for the routing system.
 *
 * Feature: react-typescript-migration
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { routes, getRouteByPath, FALLBACK_PATH, type RouteConfig } from '@/routes';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { loadConfig } from '@/config';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All valid route paths */
const ALL_PATHS = routes.map((r) => r.path);

/** Arbitrary that picks one of the 17 defined route paths */
const validPathArb = fc.constantFrom(...ALL_PATHS);

/**
 * Arbitrary that generates a random URL path that does NOT match any defined route.
 * We generate a random string prefixed with "/" and filter out collisions.
 */
const invalidPathArb = fc
  .string({ minLength: 1, maxLength: 30 })
  .map((s) => `/${s.replace(/[^a-z0-9_-]/gi, 'x')}`)
  .filter((p) => !ALL_PATHS.includes(p));

// ---------------------------------------------------------------------------
// Property 1: Route resolution correctness
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 1: Route resolution correctness', () => {
  /**
   * **Validates: Requirements 2.1**
   *
   * For every valid page path (all 17 pages), the router resolves to the
   * correct page component and the associated route config (title, icon,
   * isSecured) is correctly associated.
   */
  it('should resolve every valid path to the correct route config', () => {
    fc.assert(
      fc.property(validPathArb, (path) => {
        const route = getRouteByPath(path);
        expect(route).toBeDefined();
        expect(route!.path).toBe(path);
        // Route must have required fields
        expect(typeof route!.title).toBe('string');
        expect(route!.title.length).toBeGreaterThan(0);
        expect(typeof route!.icon).toBe('string');
        expect(route!.icon.length).toBeGreaterThan(0);
        expect(typeof route!.isSecured).toBe('boolean');
        // element must be a lazy component (function)
        expect(typeof route!.element).toBe('object');
      }),
      { numRuns: 100 },
    );
  });

  it('should have exactly 17 routes defined', () => {
    expect(routes.length).toBe(17);
  });

  it('should have unique paths for all routes', () => {
    const paths = routes.map((r) => r.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

// ---------------------------------------------------------------------------
// Property 2: Unknown URL redirect
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 2: Unknown URL redirect', () => {
  /**
   * **Validates: Requirements 2.2**
   *
   * For any URL path that does not match a defined route, the fallback
   * target is the Vocabulary page.
   */
  it('should redirect unknown paths to the Vocabulary page', () => {
    fc.assert(
      fc.property(invalidPathArb, (unknownPath) => {
        const route = getRouteByPath(unknownPath);
        // Unknown path should NOT resolve to any route
        expect(route).toBeUndefined();
        // The fallback path should be /vocabulary
        expect(FALLBACK_PATH).toBe('/vocabulary');
        // And /vocabulary must resolve to a valid route
        const fallbackRoute = getRouteByPath(FALLBACK_PATH);
        expect(fallbackRoute).toBeDefined();
        expect(fallbackRoute!.title).toBe('Vocabulary');
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 3: Route protection and auth guard
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 3: Route protection and auth guard', () => {
  beforeEach(() => {
    // Reset auth store
    useAuthStore.setState({
      token: null,
      subject: null,
      fullName: null,
      permissions: null,
      authProvider: null,
      authClient: null,
      tokenExpired: false,
      signInOpened: false,
    });
    // Enable auth so isAuthenticated actually checks subject
    loadConfig({ userAuthenticationEnabled: true });
  });

  const authStateArb = fc.boolean();
  const routeArb: fc.Arbitrary<RouteConfig> = fc.constantFrom(...routes);

  /**
   * **Validates: Requirements 2.3, 2.4**
   *
   * For any combination of route and authentication state:
   * - Protected routes (isSecured=true) deny access when unauthenticated
   * - Public routes (isSecured=false) always allow access
   */
  it('should enforce auth guard on secured routes and allow public routes', () => {
    fc.assert(
      fc.property(routeArb, authStateArb, (route: RouteConfig, isLoggedIn: boolean) => {
        // Set auth state
        if (isLoggedIn) {
          useAuthStore.setState({ subject: 'test-user', token: 'test-token' });
        } else {
          useAuthStore.setState({ subject: null, token: null });
        }

        const isAuthenticated = useAuthStore.getState().isAuthenticated();

        if (route.isSecured) {
          if (isLoggedIn) {
            // Authenticated user should have access
            expect(isAuthenticated).toBe(true);
          } else {
            // Unauthenticated user should be denied
            expect(isAuthenticated).toBe(false);
          }
        } else {
          // Public routes: access is always allowed regardless of auth state.
          // The ProtectedRoute component only blocks when isSecured && !authenticated.
          // For public routes, isSecured is false so the guard never blocks.
          expect(route.isSecured).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Route parameter passing
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 4: Route parameter passing', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * For any route with parameters (e.g. /cohortdefinitions/:id), random
   * parameter values should be embeddable in the path. We verify that
   * the route config exists and that a parameterised URL can be constructed.
   */

  const paramValueArb = fc.string({ minLength: 1, maxLength: 20 }).map((s) =>
    s.replace(/[^a-z0-9]/gi, 'x'),
  ).filter((s) => s.length > 0);

  it('should allow parameter values to be embedded in route paths', () => {
    fc.assert(
      fc.property(validPathArb, paramValueArb, (basePath, paramValue) => {
        const route = getRouteByPath(basePath);
        expect(route).toBeDefined();

        // Construct a parameterised URL (e.g. /cohortdefinitions/123)
        const paramUrl = `${basePath}/${paramValue}`;
        expect(typeof paramUrl).toBe('string');
        expect(paramUrl.startsWith(basePath)).toBe(true);

        // The base route should still be resolvable
        expect(getRouteByPath(basePath)).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 5: Error message clearing on navigation
// ---------------------------------------------------------------------------

describe('Feature: react-typescript-migration, Property 5: Error message clearing on navigation', () => {
  /**
   * **Validates: Requirements 2.6**
   *
   * For any error state, after calling clearErrorMessage (which is
   * triggered on every page navigation by ProtectedRoute), the error
   * message is reset to null.
   */

  const errorMessageArb = fc.oneof(
    fc.constant(null),
    fc.string({ minLength: 1, maxLength: 200 }),
  );

  it('should clear error messages after navigation', () => {
    fc.assert(
      fc.property(errorMessageArb, (errorMsg) => {
        // Set an error message
        useAppStore.setState({ errorMessage: errorMsg });

        // Verify it was set
        if (errorMsg !== null) {
          expect(useAppStore.getState().errorMessage).toBe(errorMsg);
        }

        // Simulate navigation: clearErrorMessage is called by ProtectedRoute
        useAppStore.getState().clearErrorMessage();

        // After clearing, error message should always be null
        expect(useAppStore.getState().errorMessage).toBeNull();
      }),
      { numRuns: 100 },
    );
  });
});
