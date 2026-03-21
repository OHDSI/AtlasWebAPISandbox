import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';

/**
 * User information bar displaying login/logout and username.
 * Shown in the application header.
 */
export function UserBar() {
  const subject = useAuthStore((s) => s.subject);
  const fullName = useAuthStore((s) => s.fullName);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const resetAuthParams = useAuthStore((s) => s.resetAuthParams);
  const signInOpened = useAuthStore((s) => s.signInOpened);

  const authenticated = isAuthenticated();
  const displayName = fullName ?? subject ?? 'User';

  const handleSignIn = useCallback(() => {
    useAuthStore.setState({ signInOpened: true });
  }, []);

  const handleSignOut = useCallback(() => {
    resetAuthParams();
  }, [resetAuthParams]);

  const handleKeyDown = useCallback(
    (action: () => void) => (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        action();
      }
    },
    [],
  );

  return (
    <div
      className="flex items-center gap-3 text-sm"
      role="toolbar"
      aria-label="User actions"
      data-testid="user-bar"
    >
      {authenticated ? (
        <>
          <span data-testid="user-name" aria-label={`Signed in as ${displayName}`}>
            {displayName}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            onKeyDown={handleKeyDown(handleSignOut)}
            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Sign out"
            data-testid="sign-out-btn"
          >
            Sign Out
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSignIn}
          onKeyDown={handleKeyDown(handleSignIn)}
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Sign in"
          aria-pressed={signInOpened}
          data-testid="sign-in-btn"
        >
          Sign In
        </button>
      )}
    </div>
  );
}

export default UserBar;
