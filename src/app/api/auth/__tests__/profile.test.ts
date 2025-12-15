/**
 * Tests pour la route /api/auth/profile
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../profile/route';
import { cookies } from 'next/headers';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { isMockModeEnabled, createMockUser } from '@/lib/features/mock-auth';
import { logger } from '@/lib/utils/logger';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/features/mock-auth', () => ({
  isMockModeEnabled: vi.fn(),
  createMockUser: vi.fn(),
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const createSupabaseMock = () => ({
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
});

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('/api/auth/profile', () => {
  const mockSupabase = createSupabaseMock();
  const mockServiceSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceSupabase as any);
  });

  it('devrait retourner un utilisateur mocké si le mode mock est actif et le cookie présent', async () => {
    const cookieStore = {
      get: vi.fn().mockReturnValue({ value: 'mock-id-123' }),
    } as any;
    vi.mocked(cookies).mockResolvedValue(cookieStore);
    vi.mocked(isMockModeEnabled).mockReturnValue(true);
    const mockUser = { id: 'mock-id-123', login: 'mock', email: 'mock@example.com' };
    vi.mocked(createMockUser).mockReturnValue(mockUser as any);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual(mockUser);
    expect(createClient).not.toHaveBeenCalled();
  });

  it('devrait retourner 401 si l’utilisateur n’est pas authentifié', async () => {
    const cookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    } as any;
    vi.mocked(cookies).mockResolvedValue(cookieStore);
    vi.mocked(isMockModeEnabled).mockReturnValue(false);

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'no session' },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Non authentifié');
  });

  it('devrait retourner le profil RLS classique si disponible', async () => {
    const cookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    } as any;
    vi.mocked(cookies).mockResolvedValue(cookieStore);
    vi.mocked(isMockModeEnabled).mockReturnValue(false);

    const authUser = {
      id: 'user-1',
      email: 'user@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-1',
              login: 'userlogin',
              email: 'user@example.com',
              status: 'utilisateur',
              profile_image: null,
              description: null,
              detail: null,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            },
            error: null,
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe('user-1');
    expect(data.user.login).toBe('userlogin');
    expect(data.user.email).toBe('user@example.com');
  });

  it('devrait retourner un utilisateur par défaut si le profil n’existe pas dans public.users', async () => {
    const cookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    } as any;
    vi.mocked(cookies).mockResolvedValue(cookieStore);
    vi.mocked(isMockModeEnabled).mockReturnValue(false);

    const authUser = {
      id: 'user-2',
      email: 'nouser@example.com',
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: authUser },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.id).toBe('user-2');
    expect(data.user.email).toBe('nouser@example.com');
    expect(data.user.status).toBe('utilisateur');
  });

  it('devrait retourner 500 en cas d’erreur serveur inattendue', async () => {
    vi.mocked(cookies).mockRejectedValue(new Error('boom'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erreur serveur');
    expect(logger.error).toHaveBeenCalled();
  });
});


