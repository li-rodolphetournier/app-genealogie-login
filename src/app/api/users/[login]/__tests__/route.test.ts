/**
 * Tests pour la route /api/users/[login]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, PUT, DELETE } from '../route';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/supabase/storage', () => ({
  uploadFile: vi.fn().mockResolvedValue({ publicUrl: 'https://example.com/image.jpg' }),
  ensureBucketExists: vi.fn().mockResolvedValue(undefined),
  STORAGE_BUCKETS: { USERS: 'users' },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

const mockAdminUser = {
  id: 'admin123',
  login: 'admin',
  email: 'admin@example.com',
  status: 'administrateur' as const,
  profileImage: undefined,
  description: undefined,
  detail: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockRegularUser = {
  id: 'user123',
  login: 'testuser',
  email: 'user@example.com',
  status: 'utilisateur' as const,
  profileImage: undefined,
  description: undefined,
  detail: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockOtherUser = {
  id: 'other123',
  login: 'otheruser',
  email: 'other@example.com',
  status: 'utilisateur' as const,
  profileImage: undefined,
  description: undefined,
  detail: undefined,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('/api/users/[login]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  describe('GET', () => {
    it('devrait permettre à un utilisateur de voir son propre profil', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isAdmin: false,
        isRedactor: false,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockRegularUser.id,
                login: mockRegularUser.login,
                email: mockRegularUser.email,
                status: mockRegularUser.status,
                profile_image: null,
                description: null,
                detail: null,
                created_at: mockRegularUser.createdAt,
                updated_at: mockRegularUser.updatedAt,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/users/testuser');
      const context = {
        params: Promise.resolve({ login: 'testuser' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.login).toBe('testuser');
    });

    it('devrait permettre à un admin de voir n\'importe quel profil', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isAdmin: true,
        isRedactor: true,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockOtherUser.id,
                login: mockOtherUser.login,
                email: mockOtherUser.email,
                status: mockOtherUser.status,
                profile_image: null,
                description: null,
                detail: null,
                created_at: mockOtherUser.createdAt,
                updated_at: mockOtherUser.updatedAt,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/users/otheruser');
      const context = {
        params: Promise.resolve({ login: 'otheruser' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.login).toBe('otheruser');
    });

    it('devrait rejeter si un utilisateur essaie de voir le profil d\'un autre', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isAdmin: false,
        isRedactor: false,
      });

      const request = new NextRequest('http://localhost:3000/api/users/otheruser');
      const context = {
        params: Promise.resolve({ login: 'otheruser' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Accès non autorisé');
    });

    it('devrait rejeter si non authentifié', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isRedactor: false,
      });

      const request = new NextRequest('http://localhost:3000/api/users/testuser');
      const context = {
        params: Promise.resolve({ login: 'testuser' }),
      };

      const response = await GET(request, context);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Non authentifié');
    });
  });

  describe('PUT', () => {
    it('devrait permettre à un utilisateur de modifier son propre profil', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isAdmin: false,
        isRedactor: false,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockRegularUser.id,
                login: mockRegularUser.login,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockRegularUser.id,
                  login: mockRegularUser.login,
                  email: 'newemail@example.com',
                  status: mockRegularUser.status,
                  profile_image: null,
                  description: 'Nouvelle description',
                  detail: null,
                  created_at: mockRegularUser.createdAt,
                  updated_at: '2024-01-02T00:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/users/testuser', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'newemail@example.com',
          description: 'Nouvelle description',
        }),
        headers: { 'content-type': 'application/json' },
      });
      const context = {
        params: Promise.resolve({ login: 'testuser' }),
      };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.email).toBe('newemail@example.com');
      expect(data.data.description).toBe('Nouvelle description');
    });

    it('devrait permettre à un admin de modifier n\'importe quel profil', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isAdmin: true,
        isRedactor: true,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockOtherUser.id,
                login: mockOtherUser.login,
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: mockOtherUser.id,
                  login: mockOtherUser.login,
                  email: 'updated@example.com',
                  status: 'redacteur',
                  profile_image: null,
                  description: null,
                  detail: null,
                  created_at: mockOtherUser.createdAt,
                  updated_at: '2024-01-02T00:00:00Z',
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/users/otheruser', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'updated@example.com',
          status: 'redacteur',
        }),
        headers: { 'content-type': 'application/json' },
      });
      const context = {
        params: Promise.resolve({ login: 'otheruser' }),
      };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.email).toBe('updated@example.com');
      expect(data.data.status).toBe('redacteur');
    });

    it('devrait rejeter si un utilisateur essaie de modifier le profil d\'un autre', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isAdmin: false,
        isRedactor: false,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockOtherUser.id,
                login: mockOtherUser.login,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/users/otheruser', {
        method: 'PUT',
        body: JSON.stringify({
          email: 'hacked@example.com',
        }),
        headers: { 'content-type': 'application/json' },
      });
      const context = {
        params: Promise.resolve({ login: 'otheruser' }),
      };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Accès non autorisé');
    });

    it('devrait rejeter si un utilisateur essaie de modifier son propre statut', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isAdmin: false,
        isRedactor: false,
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockRegularUser.id,
                login: mockRegularUser.login,
              },
              error: null,
            }),
          }),
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/users/testuser', {
        method: 'PUT',
        body: JSON.stringify({
          status: 'administrateur',
        }),
        headers: { 'content-type': 'application/json' },
      });
      const context = {
        params: Promise.resolve({ login: 'testuser' }),
      };

      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Seuls les administrateurs peuvent modifier le statut');
    });
  });

  describe('DELETE', () => {
    it('devrait permettre à un admin de supprimer un utilisateur', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isAdmin: true,
        isRedactor: true,
      });

      const mockDeleteChain = {
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockOtherUser.id,
              },
              error: null,
            }),
          }),
        }),
        delete: vi.fn().mockReturnValue(mockDeleteChain),
      });

      const request = new NextRequest('http://localhost:3000/api/users/otheruser', {
        method: 'DELETE',
      });
      const context = {
        params: Promise.resolve({ login: 'otheruser' }),
      };

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('supprimé avec succès');
    });

    it('devrait rejeter si un utilisateur non-admin essaie de supprimer un utilisateur', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockRegularUser,
        isAuthenticated: true,
        isAdmin: false,
        isRedactor: false,
      });

      const request = new NextRequest('http://localhost:3000/api/users/otheruser', {
        method: 'DELETE',
      });
      const context = {
        params: Promise.resolve({ login: 'otheruser' }),
      };

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Administrateur requis');
    });

    it('devrait rejeter si non authentifié', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isRedactor: false,
      });

      const request = new NextRequest('http://localhost:3000/api/users/testuser', {
        method: 'DELETE',
      });
      const context = {
        params: Promise.resolve({ login: 'testuser' }),
      };

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Administrateur requis');
    });

    it('devrait rejeter si l\'utilisateur à supprimer n\'existe pas', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: mockAdminUser,
        isAuthenticated: true,
        isAdmin: true,
        isRedactor: true,
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

      const request = new NextRequest('http://localhost:3000/api/users/nonexistent', {
        method: 'DELETE',
      });
      const context = {
        params: Promise.resolve({ login: 'nonexistent' }),
      };

      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });
  });
});

