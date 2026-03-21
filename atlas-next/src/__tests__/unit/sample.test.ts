import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Test infrastructure verification', () => {
  it('should run a basic unit test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support fast-check property-based testing', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(a + b).toBe(b + a);
      }),
    );
  });
});
