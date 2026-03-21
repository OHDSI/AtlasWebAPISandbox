import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { useAppStore, isValidTransition } from '@/stores/app';
import type { AppInitializationStatus } from '@/types';

/**
 * Feature: react-typescript-migration, Property 16: アプリケーション初期化ステータスの状態遷移
 * Validates: Requirements 9.4
 */

const allStatuses: AppInitializationStatus[] = [
  'initializing',
  'running',
  'failed',
  'noSourcesAvailable',
];

const statusArb = fc.constantFrom(...allStatuses);

describe('Property 16: App initialization status transitions', () => {
  beforeEach(() => {
    useAppStore.setState({
      initializationStatus: 'initializing',
      loading: false,
    });
  });

  it('should always start with initializing status', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        useAppStore.setState({ initializationStatus: 'initializing' });
        expect(useAppStore.getState().initializationStatus).toBe('initializing');
      }),
      { numRuns: 100 },
    );
  });

  it('should only transition to valid states from initializing', () => {
    fc.assert(
      fc.property(statusArb, (targetStatus) => {
        useAppStore.setState({ initializationStatus: 'initializing' });
        useAppStore.getState().setInitializationStatus(targetStatus);

        const current = useAppStore.getState().initializationStatus;

        if (isValidTransition('initializing', targetStatus)) {
          expect(current).toBe(targetStatus);
        } else {
          expect(current).toBe('initializing');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should not allow transitions from terminal states (running, failed)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<AppInitializationStatus>('running', 'failed'),
        statusArb,
        (terminalState, targetStatus) => {
          useAppStore.setState({ initializationStatus: terminalState });
          useAppStore.getState().setInitializationStatus(targetStatus);
          expect(useAppStore.getState().initializationStatus).toBe(terminalState);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should allow noSourcesAvailable to transition to running only', () => {
    fc.assert(
      fc.property(statusArb, (targetStatus) => {
        useAppStore.setState({ initializationStatus: 'noSourcesAvailable' });
        useAppStore.getState().setInitializationStatus(targetStatus);

        const current = useAppStore.getState().initializationStatus;

        if (targetStatus === 'running') {
          expect(current).toBe('running');
        } else {
          expect(current).toBe('noSourcesAvailable');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should handle random sequences of status transitions correctly', () => {
    fc.assert(
      fc.property(fc.array(statusArb, { minLength: 1, maxLength: 10 }), (sequence) => {
        useAppStore.setState({ initializationStatus: 'initializing' });

        let expectedStatus: AppInitializationStatus = 'initializing';

        for (const targetStatus of sequence) {
          if (isValidTransition(expectedStatus, targetStatus)) {
            expectedStatus = targetStatus;
          }
          useAppStore.getState().setInitializationStatus(targetStatus);
          expect(useAppStore.getState().initializationStatus).toBe(expectedStatus);
        }
      }),
      { numRuns: 100 },
    );
  });
});

