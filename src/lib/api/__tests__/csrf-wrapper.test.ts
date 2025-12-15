import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withCsrfProtection } from '../csrf-wrapper';
import { verifyCsrfToken } from '@/lib/security/csrf';
import type { NextRequest } from 'next/server';

vi.mock('@/lib/security/csrf', () => ({
  verifyCsrfToken: vi.fn(),
}));

describe('withCsrfProtection', () => {
  const handler = vi.fn(async () => {
    return new Response(JSON.stringify({ ok: true }), { status: 200 }) as any;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('laisse passer les requêtes GET sans vérifier le CSRF', async () => {
    const wrapped = withCsrfProtection(handler);
    const request = new Request('http://localhost/api', { method: 'GET' }) as NextRequest;

    const response = await wrapped(request);
    expect(handler).toHaveBeenCalled();
    expect(verifyCsrfToken).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('retourne 403 si le token CSRF est invalide', async () => {
    vi.mocked(verifyCsrfToken).mockResolvedValue(false);
    const wrapped = withCsrfProtection(handler);
    const request = new Request('http://localhost/api', { method: 'POST' }) as NextRequest;

    const response = await wrapped(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Token CSRF');
  });

  it('appelle le handler si le token CSRF est valide', async () => {
    vi.mocked(verifyCsrfToken).mockResolvedValue(true);
    const wrapped = withCsrfProtection(handler);
    const request = new Request('http://localhost/api', { method: 'POST' }) as NextRequest;

    const response = await wrapped(request);

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});


