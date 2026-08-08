import assert from 'node:assert';
import { test } from 'node:test';

export type CheckReporter = (claim: string, holds: boolean) => void;

export function checksNamed(suite: string, run: (check: CheckReporter) => void): void {
  test(suite, () => {
    run((claim, holds) => assert.ok(holds, claim));
  });
}

export function isCloseTo(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

export function isWithinFraction(actual: number, expected: number, fraction: number): boolean {
  return Math.abs(actual - expected) <= Math.abs(expected) * fraction;
}
