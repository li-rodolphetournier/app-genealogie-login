/**
 * Tests pour la route /api/auth/admin/reset-password
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../admin/reset-password/route';
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

// Mock du logger d'audit pour éviter les erreurs dans les tests
vi.mock('@/lib/audit/password-reset-logger', () => ({
  logPasswordResetAction: vi.fn().mockResolvedValue(undefined),
  getIpAddress: vi.fn(() => '127.0.0.1'),
  getUserAgent: vi.fn(() => 'test-agent'),
}));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
  auth: {
    admin: {
      generateLink: vi.fn(),
    },
  },
};

describe('/api/auth/admin/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  describe('POST', () => {
    it('devrait permettre à un admin de réinitialiser un mot de passe', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'admin123', login: 'admin', status: 'administrateur' },
      });

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user123',
                email: 'user@example.com',
                login: 'testuser',
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabase.auth.admin.generateLink.mockResolvedValue({
        data: { properties: { hashed_token: 'token123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          userLogin: 'testuser',
          reason: 'Mot de passe oublié',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('lien de réinitialisation');
      expect(data.data.email).toBe('user@example.com');
    });

    it('devrait rejeter si l\'utilisateur n\'est pas admin', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'user123', login: 'testuser', status: 'utilisateur' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          userLogin: 'otheruser',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Administrateur requis');
    });

    it('devrait rejeter si non authentifié', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          userLogin: 'testuser',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Administrateur requis');
    });

    it('devrait rejeter si l\'utilisateur cible n\'existe pas', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'admin123', login: 'admin', status: 'administrateur' },
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

      const request = new NextRequest('http://localhost:3000/api/auth/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          userLogin: 'nonexistent',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('non trouvé');
    });

    it('devrait rejeter si le login utilisateur est manquant', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'admin123', login: 'admin', status: 'administrateur' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/admin/reset-password', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      // Le message peut varier selon la version de Zod
      expect(data.error).toMatch(/login|required|string/i);
    });
  });
});

