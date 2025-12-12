/**
 * Tests pour la route /api/auth/change-password
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../change-password/route';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { NextRequest } from 'next/server';

// Mocks
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
  },
};

describe('/api/auth/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  describe('POST', () => {
    it('devrait changer le mot de passe avec succès', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'user123', login: 'testuser' },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'user@example.com' } },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain('modifié avec succès');
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });

    it('devrait rejeter si non authentifié', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: null,
      });

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Non authentifié');
    });

    it('devrait rejeter si le mot de passe actuel est incorrect', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'user123', login: 'testuser' },
      });

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123', email: 'user@example.com' } },
        error: null,
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Mot de passe actuel incorrect');
    });

    it('devrait rejeter si le nouveau mot de passe est trop court', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'user123', login: 'testuser' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpassword',
          newPassword: 'short',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('6 caractères');
    });

    it('devrait rejeter si le mot de passe actuel est manquant', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'user123', login: 'testuser' },
      });

      const request = new NextRequest('http://localhost:3000/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          newPassword: 'newpassword123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      // Le message peut varier selon la version de Zod
      expect(data.error).toMatch(/mot de passe actuel|required|string/i);
    });
  });
});

