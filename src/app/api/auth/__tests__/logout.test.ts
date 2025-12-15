/**
 * Tests pour la route /api/auth/logout
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../logout/route';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const createSupabaseMock = () => ({
  auth: {
    signOut: vi.fn(),
  },
});

describe('/api/auth/logout', () => {
  const mockSupabase = createSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  it('devrait se déconnecter avec succès', async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({ error: null });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Déconnexion réussie');
    expect(mockSupabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('devrait retourner une erreur 500 si la déconnexion échoue', async () => {
    mockSupabase.auth.signOut.mockResolvedValueOnce({
      error: { message: 'signout failed' },
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Erreur lors de la déconnexion');
    expect(logger.error).toHaveBeenCalled();
  });
});


