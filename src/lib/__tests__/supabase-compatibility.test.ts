/**
 * Tests de compatibilité Supabase avec Next.js 16
 * Vérifie que les clients Supabase sont correctement initialisés
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Supabase Compatibility', () => {
  beforeEach(() => {
    // Mock des variables d'environnement
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key');
  });

  it('should have correct @supabase/ssr version', async () => {
    const { version } = await import('@supabase/ssr/package.json');
    expect(version).toMatch(/^0\.8\./);
  });

  it('should have compatible @supabase/supabase-js version', async () => {
    const { version } = await import('@supabase/supabase-js/package.json');
    // Doit être >= 2.76.1 pour @supabase/ssr@0.8.0
    const major = parseInt(version.split('.')[0]);
    const minor = parseInt(version.split('.')[1]);
    expect(major).toBe(2);
    expect(minor).toBeGreaterThanOrEqual(76);
  });

  it('should create browser client without errors', async () => {
    const { createBrowserClient } = await import('@supabase/ssr');
    const client = createBrowserClient(
      'https://test.supabase.co',
      'test-anon-key'
    );
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it('should create server client without errors', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const cookies = {
      getAll: () => [],
      setAll: () => {},
    };

    const client = createServerClient(
      'https://test.supabase.co',
      'test-anon-key',
      { cookies }
    );
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });
});
