/**
 * Tests pour la route /api/auth/forgot-password
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../forgot-password/route';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
  createClient: vi.fn(),
}));

// Mock du logger d'audit pour éviter les erreurs dans les tests
vi.mock('@/lib/audit/password-reset-logger', () => ({
  logPasswordResetAction: vi.fn().mockResolvedValue(undefined),
  getIpAddress: vi.fn(() => '127.0.0.1'),
  getUserAgent: vi.fn(() => 'test-agent'),
}));

const mockServiceSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  auth: {
    admin: {
      listUsers: vi.fn(),
      createUser: vi.fn(),
    },
  },
};

const mockPublicSupabase = {
  auth: {
    resetPasswordForEmail: vi.fn(),
  },
};

describe('/api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockServiceSupabase as any);
    vi.mocked(createClient).mockResolvedValue(mockPublicSupabase as any);
  });

  describe('POST', () => {
    it('devrait accepter un email valide', async () => {
      // Mock : utilisateur n'existe pas dans public.users (cas normal)
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

      // Mock : utilisateur n'existe pas dans auth.users
      mockServiceSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockPublicSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('lien de réinitialisation');
      expect(mockPublicSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });

    it('devrait accepter un login valide', async () => {
      // Mock : récupération de l'email depuis le login
      mockServiceSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { email: 'user@example.com' },
              error: null,
            }),
          }),
        }),
      });

      // Mock : vérification dans public.users (pour le cas où l'utilisateur existe dans public.users mais pas dans auth.users)
      mockServiceSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      // Mock : utilisateur n'existe pas dans auth.users
      mockServiceSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockPublicSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ login: 'username' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('lien de réinitialisation');
      expect(mockPublicSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'user@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      );
    });

    it('devrait retourner une erreur si ni email ni login fourni', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('ne devrait pas révéler si un utilisateur existe ou non', async () => {
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

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ login: 'nonexistent' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Même si l'utilisateur n'existe pas, on retourne un message générique
      expect(response.status).toBe(200);
      expect(data.message).toContain('lien de réinitialisation');
    });

    it('devrait créer un compte auth.users si l\'utilisateur existe dans public.users mais pas dans auth.users', async () => {
      // Mock : utilisateur existe dans public.users
      mockServiceSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'user-id-123', email: 'user@example.com', login: 'testuser', status: 'utilisateur' },
              error: null,
            }),
          }),
        }),
      });

      // Mock : utilisateur n'existe pas dans auth.users
      mockServiceSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      // Mock : création de l'utilisateur dans auth.users
      mockServiceSupabase.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'user-id-123', email: 'user@example.com' } },
        error: null,
      });

      // Mock : mise à jour de l'ID dans public.users (si nécessaire)
      mockServiceSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      mockPublicSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('lien de réinitialisation');
      expect(mockServiceSupabase.auth.admin.createUser).toHaveBeenCalled();
      expect(mockPublicSupabase.auth.resetPasswordForEmail).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de génération de lien', async () => {
      // Mock : utilisateur n'existe pas dans public.users
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

      // Mock : utilisateur n'existe pas dans auth.users
      mockServiceSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] },
        error: null,
      });

      mockPublicSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'Erreur génération' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Ne pas révéler l'erreur à l'utilisateur
      expect(response.status).toBe(200);
      expect(data.message).toContain('lien de réinitialisation');
    });
  });
});

