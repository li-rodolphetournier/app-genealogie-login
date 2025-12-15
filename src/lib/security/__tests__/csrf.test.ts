import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCsrfToken, setCsrfToken, getCsrfToken, verifyCsrfToken } from '../csrf';
import { cookies } from 'next/headers';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('security/csrf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateCsrfToken doit retourner une chaîne hexadécimale de 64 caractères', () => {
    const token = generateCsrfToken();
    expect(token).toHaveLength(64);
  });

  it('setCsrfToken doit écrire un cookie csrf-token', async () => {
    const set = vi.fn();
    vi.mocked(cookies).mockResolvedValue({ set, get: vi.fn() } as any);

    const token = await setCsrfToken();
    expect(set).toHaveBeenCalled();
    expect(typeof token).toBe('string');
  });

  it('getCsrfToken retourne le token stocké dans les cookies', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'abc' }),
      set: vi.fn(),
    } as any);

    const token = await getCsrfToken();
    expect(token).toBe('abc');
  });

  it('verifyCsrfToken retourne true si cookie et header correspondent', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: 'token-123' }),
      set: vi.fn(),
    } as any);

    const request = new Request('http://localhost/api', {
      headers: { 'x-csrf-token': 'token-123' },
    });

    const result = await verifyCsrfToken(request);
    expect(result).toBe(true);
  });
});


