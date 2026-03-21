import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

interface ProtectedRouteProps {
  isSecured: boolean;
  children: ReactNode;
}

/**
 * Route guard component.
 *
 * - If `isSecured` is true and the user is not authenticated,
 *   renders an access-denied "white page" instead of the children.
 * - Clears any error message in the app store on every location change.
 */
export function ProtectedRoute({ isSecured, children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearErrorMessage = useAppStore((s) => s.clearErrorMessage);

  // Clear error messages on every navigation
  useEffect(() => {
    clearErrorMessage();
  }, [location.pathname, clearErrorMessage]);

  if (isSecured && !isAuthenticated()) {
    return (
      <div data-testid="access-denied" className="white-page">
        <h2>Access Denied</h2>
        <p>You are not authorized to access this page. Please sign in.</p>
      </div>
    );
  }

  return <>{children}</>;
}
