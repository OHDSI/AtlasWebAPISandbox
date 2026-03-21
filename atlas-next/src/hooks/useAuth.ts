import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { tokenExpirationDate, refreshToken } from '@/api/auth';
import { getConfig } from '@/config';

/**
 * Interaction event types that trigger a token refresh check.
 * Mirrors the legacy Application.js pattern.
 */
const INTERACTION_EVENTS: Array<keyof WindowEventMap> = ['mouseover', 'keydown', 'focusin'];

/**
 * Number of interaction events between each refresh check.
 * Every Nth event we actually inspect the token expiry.
 */
const INTERACTION_THRESHOLD = 30;

/**
 * Hook that monitors user interaction events and automatically refreshes
 * the auth token when it is close to expiring.
 *
 * Mirrors the legacy Application.js bootstrap logic:
 * - Listens to mouseover / keydown / focusin on window
 * - Every 30th interaction, checks if token is within refreshTokenThreshold of expiry
 * - If so, calls refreshToken()
 *
 * Validates: Requirements 4.2
 */
export function useAuth(): void {
  const interactionCount = useRef(0);

  useEffect(() => {
    const handleInteraction = () => {
      interactionCount.current++;

      if (interactionCount.current % INTERACTION_THRESHOLD !== 0) {
        return;
      }

      interactionCount.current = 0;

      const { isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated()) {
        return;
      }

      const expDate = tokenExpirationDate();
      if (!expDate) {
        return;
      }

      const timeToExpire = expDate.getTime() - Date.now();
      const { refreshTokenThreshold } = getConfig();

      if (timeToExpire <= refreshTokenThreshold) {
        refreshToken();
      }
    };

    for (const event of INTERACTION_EVENTS) {
      window.addEventListener(event, handleInteraction);
    }

    return () => {
      for (const event of INTERACTION_EVENTS) {
        window.removeEventListener(event, handleInteraction);
      }
    };
  }, []);
}
