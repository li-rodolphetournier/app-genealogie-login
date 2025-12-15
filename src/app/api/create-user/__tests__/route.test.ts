/**
 * Tests pour la route /api/create-user (POST simplifié)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
  auth: {
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
});

describe('/api/create-user', () => {
  const mockSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  const createRequest = (body: unknown) =>
    new Request('http://localhost/api/create-user', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  it('devrait retourner 400 si les données sont invalides', async () => {
    const response = await POST(createRequest({ login: '' }));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('devrait retourner 409 si le login ou l’email existe déjà', async () => {
    mockSupabase.from.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { login: 'user1', email: 'user1@example.com' },
              error: null,
            }),
          }),
        }),
      }),
    });

    const response = await POST(
      createRequest({
        login: 'user1',
        email: 'user1@example.com',
        password: 'password123',
        status: 'utilisateur',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toContain('déjà utilisé');
  });
});


