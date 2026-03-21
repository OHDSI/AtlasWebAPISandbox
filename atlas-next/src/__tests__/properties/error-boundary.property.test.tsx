import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Feature: react-typescript-migration, Property 17: Error Boundaryによるエラーキャッチ
 * Validates: Requirements 9.5
 *
 * For any component that throws an error during rendering,
 * the Error Boundary catches it and displays a fallback UI.
 * The application does not crash entirely.
 */

function ThrowingComponent({ error }: { error: Error }): React.ReactNode {
  throw error;
}

function SafeComponent({ text }: { text: string }) {
  return <div data-testid="safe-content">{text}</div>;
}

describe('Property 17: Error Boundary catches errors and shows fallback UI', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === 'string' ? args[0] : '';
      if (
        msg.includes('ErrorBoundary') ||
        msg.includes('The above error occurred') ||
        msg.includes('Error: Uncaught')
      ) {
        return;
      }
      originalConsoleError(...args);
    };
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should catch random errors and display fallback UI', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (errorMessage) => {
          const error = new Error(errorMessage);

          const { unmount } = render(
            <ErrorBoundary>
              <ThrowingComponent error={error} />
            </ErrorBoundary>,
          );

          const fallback = screen.getByTestId('error-boundary-fallback');
          expect(fallback).toBeInTheDocument();
          expect(fallback).toHaveAttribute('role', 'alert');

          const retryBtn = screen.getByTestId('error-boundary-retry');
          expect(retryBtn).toBeInTheDocument();

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should not show fallback when children render successfully', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (text) => {
          const { unmount } = render(
            <ErrorBoundary>
              <SafeComponent text={text} />
            </ErrorBoundary>,
          );

          expect(screen.getByTestId('safe-content')).toBeInTheDocument();
          expect(screen.getByTestId('safe-content').textContent).toBe(text);
          expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should display custom fallback when provided', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (errorMessage, fallbackText) => {
          const error = new Error(errorMessage);

          const { unmount } = render(
            <ErrorBoundary fallback={<div data-testid="custom-fallback">{fallbackText}</div>}>
              <ThrowingComponent error={error} />
            </ErrorBoundary>,
          );

          const customFallback = screen.getByTestId('custom-fallback');
          expect(customFallback).toBeInTheDocument();
          expect(customFallback.textContent).toBe(fallbackText);
          expect(screen.queryByTestId('error-boundary-fallback')).not.toBeInTheDocument();

          unmount();
        },
      ),
      { numRuns: 100 },
    );
  });
});
