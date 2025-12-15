/**
 * Tests pour la route /api/csrf/token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { getCsrfToken, setCsrfToken } from '@/lib/security/csrf';

vi.mock('@/lib/security/csrf', () => ({
  getCsrfToken: vi.fn(),
  setCsrfToken: vi.fn(),
}));

describe('/api/csrf/token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner un token existant depuis les cookies', async () => {
    vi.mocked(getCsrfToken).mockResolvedValue('existing-token');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('existing-token');
    expect(setCsrfToken).not.toHaveBeenCalled();
  });

  it('devrait générer un nouveau token si aucun n’existe', async () => {
    vi.mocked(getCsrfToken).mockResolvedValue(null);
    vi.mocked(setCsrfToken).mockResolvedValue('new-token');

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(getCsrfToken).toHaveBeenCalled();
    expect(setCsrfToken).toHaveBeenCalled();
    expect(data.token).toBe('new-token');
  });
});


