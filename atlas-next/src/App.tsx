import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { Loading } from '@/components/Loading';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { routes, FALLBACK_PATH } from '@/routes';
import { useAppStore } from '@/stores/app';
import { useSourceStore } from '@/stores/source';
import { getConfig } from '@/config';
import { sourceApi } from '@/api/source';
import { loadUserInfo, checkOAuthError } from '@/api/auth';
import { createQueryClient } from '@/api/types';
import type { AppInitializationStatus, Source } from '@/types';

const queryClient = createQueryClient();

/**
 * Splash screen displayed during application initialization.
 */
function SplashScreen({ status }: { status: AppInitializationStatus }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-white"
      data-testid="splash-screen"
    >
      <img src="/images/atlas_loading.svg" alt="Atlas Loading" className="w-24 h-24 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">ATLAS</h1>
      <Loading message={status === 'initializing' ? 'Initializing...' : undefined} />
      <p className="text-sm text-gray-500 mt-2" data-testid="splash-status">
        {status}
      </p>
    </div>
  );
}

/**
 * Error screen shown when initialization fails.
 */
function InitFailedScreen({ message }: { message?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-white text-center p-8"
      data-testid="init-failed-screen"
      role="alert"
    >
      <h2 className="text-xl font-semibold text-red-600 mb-4">Application Initialization Failed</h2>
      {message && <p className="text-sm text-gray-600 mb-4">{message}</p>}
      <p className="text-sm text-gray-500">
        Please contact your system administrator.
      </p>
    </div>
  );
}

/**
 * Screen shown when no data sources are configured.
 */
function NoSourcesScreen() {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen bg-white text-center p-8"
      data-testid="no-sources-screen"
      role="alert"
    >
      <h2 className="text-xl font-semibold text-yellow-600 mb-4">No Data Sources Available</h2>
      <p className="text-sm text-gray-600 mb-4">
        No data sources have been configured. Please visit the Configuration page to set up a data source.
      </p>
    </div>
  );
}

/**
 * Helper: resolve daimon priority URLs from sources.
 */
function resolveDaimonUrls(sources: Source[], config: ReturnType<typeof getConfig>) {
  let vocabularyUrl: string | null = null;
  let evidenceUrl: string | null = null;
  let resultsUrl: string | null = null;

  for (const source of sources) {
    for (const daimon of source.daimons) {
      const url = `${config.webAPIRoot}${source.sourceKey}/`;
      if (daimon.daimonType === 'Vocabulary' && !vocabularyUrl) {
        vocabularyUrl = url;
      }
      if (daimon.daimonType === 'Evidence' && !evidenceUrl) {
        evidenceUrl = url;
      }
      if (daimon.daimonType === 'Results' && !resultsUrl) {
        resultsUrl = url;
      }
    }
  }

  return { vocabularyUrl, evidenceUrl, resultsUrl };
}

/**
 * Run the application initialization sequence:
 * 1. Check WebAPI connection (GET info endpoint)
 * 2. Load source configuration
 * 3. Restore authentication state
 */
async function initializeApp(): Promise<void> {
  const config = getConfig();
  const setStatus = useAppStore.getState().setInitializationStatus;

  try {
    // Step 1: Check WebAPI connection
    const infoResponse = await fetch(`${config.webAPIRoot}info`, { method: 'GET' });
    if (!infoResponse.ok) {
      throw new Error(`WebAPI connection failed: ${infoResponse.status}`);
    }

    // Step 2: Load source configuration
    const sources = await sourceApi.getAll();
    useSourceStore.getState().setSources(sources);

    if (!sources || sources.length === 0) {
      setStatus('noSourcesAvailable');
      return;
    }

    // Resolve daimon URLs from sources
    const urls = resolveDaimonUrls(sources, config);
    const sourceStore = useSourceStore.getState();
    sourceStore.setDefaults(urls);
    // Only set URLs if not already restored from session storage
    if (!sourceStore.vocabularyUrl) sourceStore.setVocabularyUrl(urls.vocabularyUrl);
    if (!sourceStore.evidenceUrl) sourceStore.setEvidenceUrl(urls.evidenceUrl);
    if (!sourceStore.resultsUrl) sourceStore.setResultsUrl(urls.resultsUrl);

    // Step 3: Restore authentication state
    if (config.userAuthenticationEnabled) {
      checkOAuthError();
      try {
        await loadUserInfo();
      } catch {
        // Auth failure is non-fatal during init — user can sign in later
        console.warn('[App] Failed to restore auth state during initialization');
      }
    }

    setStatus('running');
  } catch (error) {
    console.error('[App] Initialization failed:', error);
    setStatus('failed');
  }
}

/**
 * Application routes rendered inside the Layout.
 */
function AppRoutes() {
  return (
    <Layout>
      <Suspense fallback={<Loading message="Loading page..." />}>
        <Routes>
          {routes.map((route) => {
            const PageComponent = route.element;
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <ProtectedRoute isSecured={route.isSecured}>
                    <PageComponent />
                  </ProtectedRoute>
                }
              />
            );
          })}
          {/* Catch-all: redirect unknown URLs to vocabulary */}
          <Route path="*" element={<Navigate to={FALLBACK_PATH} replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

/**
 * Root application component.
 *
 * Wraps the app in:
 * - QueryClientProvider (TanStack Query)
 * - BrowserRouter (React Router)
 * - ErrorBoundary
 *
 * Handles initialization states:
 * - initializing → splash screen
 * - running → main app with routes
 * - failed → error screen
 * - noSourcesAvailable → no sources message (with config page accessible)
 */
export default function App() {
  const initializationStatus = useAppStore((s) => s.initializationStatus);

  useEffect(() => {
    initializeApp();
  }, []);

  const renderContent = () => {
    switch (initializationStatus) {
      case 'initializing':
        return <SplashScreen status={initializationStatus} />;
      case 'failed':
        return <InitFailedScreen />;
      case 'noSourcesAvailable':
        return (
          <BrowserRouter>
            <NoSourcesScreen />
          </BrowserRouter>
        );
      case 'running':
        return (
          <BrowserRouter>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </BrowserRouter>
        );
      default:
        return <SplashScreen status="initializing" />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderContent()}
    </QueryClientProvider>
  );
}
