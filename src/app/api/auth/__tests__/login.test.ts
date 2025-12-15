/**
 * Tests pour la route /api/auth/login
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../login/route';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getErrorMessage } from '@/lib/errors/messages';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/errors/messages', () => ({
  getErrorMessage: vi.fn((code: string) => code),
}));

type MockUser = {
  id: string;
  email: string;
};

const createSupabaseAuthMock = () => ({
  auth: {
    signInWithPassword: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(),
});

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('/api/auth/login', () => {
  const mockSupabase = createSupabaseAuthMock();
  const mockServiceSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceSupabase as any);
  });

  const createRequest = (body: unknown) =>
    new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  it('devrait authentifier avec succès en utilisant directement l’email', async () => {
    const user: MockUser = {
      id: 'user-1',
      email: 'user@example.com',
    };

    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: user.id,
              login: 'userlogin',
              email: user.email,
              status: 'utilisateur',
              description: 'desc',
              profile_image: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            },
            error: null,
          }),
        }),
      }),
    });

    const request = createRequest({
      login: 'user@example.com',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
    expect(data.user.email).toBe('user@example.com');
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
  });

  it('devrait réessayer avec l’email trouvé par login si la première tentative échoue', async () => {
    const user: MockUser = {
      id: 'user-2',
      email: 'found@example.com',
    };

    // Première tentative échoue
    mockSupabase.auth.signInWithPassword
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      } as any)
      // Deuxième tentative réussit
      .mockResolvedValueOnce({
        data: { user },
        error: null,
      } as any);

    // Recherche par login dans la table users
    mockServiceSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'found@example.com' },
            error: null,
          }),
        }),
      }),
    });

    // Profil utilisateur
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: user.id,
              login: 'login-from-profile',
              email: user.email,
              status: 'utilisateur',
              description: null,
              profile_image: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            },
            error: null,
          }),
        }),
      }),
    });

    const request = createRequest({
      login: 'login-from-form',
      password: 'password123',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.email).toBe('found@example.com');
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledTimes(2);
    expect(mockServiceSupabase.from).toHaveBeenCalledWith('users');
  });

  it('devrait retourner 401 si les identifiants sont incorrects même après recherche par login', async () => {
    mockSupabase.auth.signInWithPassword
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      } as any)
      .mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      } as any);

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

    const request = createRequest({
      login: 'unknown',
      password: 'wrong',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Identifiants incorrects');
  });

  it('devrait retourner 500 en cas d’erreur serveur inattendue', async () => {
    // Simuler une erreur dans request.json()
    const request = {
      json: vi.fn().mockRejectedValue(new Error('boom')),
    } as unknown as Request;

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(getErrorMessage).toHaveBeenCalledWith('SERVER_ERROR');
    expect(data.error).toBe('SERVER_ERROR');
  });
});


