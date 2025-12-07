/**
 * Tests de compatibilité Next.js 16
 * Vérifie que les versions des packages sont compatibles avec Next.js 16
 */

import { describe, it, expect } from 'vitest';

describe('Next.js 16 Compatibility', () => {
  it('should have Next.js 16 installed', async () => {
    const { version } = await import('next/package.json');
    const major = parseInt(version.split('.')[0]);
    expect(major).toBe(16);
  });

  it('should have React 18 or 19', async () => {
    const { version } = await import('react/package.json');
    const major = parseInt(version.split('.')[0]);
    expect([18, 19]).toContain(major);
  });

  it('should have TypeScript 5.1+', async () => {
    const { version } = await import('typescript/package.json');
    const [major, minor] = version.split('.').map(Number);
    expect(major).toBe(5);
    expect(minor).toBeGreaterThanOrEqual(1);
  });

  it('should have compatible ESLint version', async () => {
    const { version } = await import('eslint/package.json');
    const major = parseInt(version.split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(9);
  });

  it('should have Zod 4 installed', async () => {
    const { version } = await import('zod/package.json');
    const major = parseInt(version.split('.')[0]);
    expect(major).toBe(4);
  });
});
