/**
 * Tests pour la route /api/auth/get-email-by-login
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../get-email-by-login/route';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/errors/messages';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/errors/messages', () => ({
  getErrorMessage: vi.fn((code: string) => code),
}));

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('/api/auth/get-email-by-login', () => {
  const mockServiceSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceSupabase as any);
  });

  const createRequest = (body: unknown) =>
    new Request('http://localhost:3000/api/auth/get-email-by-login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  it('devrait retourner 400 si le login est manquant', async () => {
    const response = await POST(createRequest({}));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Login requis');
  });

  it('devrait retourner l’email associé à un login existant', async () => {
    mockServiceSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'user@example.com' },
            error: null,
          }),
        }),
      }),
    });

    const response = await POST(
      createRequest({
        login: 'userlogin',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).toBe('user@example.com');
  });

  it('devrait retourner 404 si aucun utilisateur n’est trouvé', async () => {
    mockServiceSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    const response = await POST(
      createRequest({
        login: 'unknown',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(getErrorMessage).toHaveBeenCalledWith('USER_NOT_FOUND');
    expect(data.error).toBe('USER_NOT_FOUND');
  });
});


