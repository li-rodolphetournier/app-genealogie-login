/**
 * Tests unitaires pour UserService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../user.service';
import { createServerClient } from '@/lib/supabase/server';

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: vi.fn(),
}));

describe('UserService', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        updateUserById: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createServerClient as any).mockResolvedValue(mockSupabaseClient);
  });

  describe('findAll', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      const mockUsers = [
        {
          id: '1',
          login: 'user1',
          email: 'user1@example.com',
          status: 'utilisateur',
        },
        {
          id: '2',
          login: 'user2',
          email: 'user2@example.com',
          status: 'administrateur',
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: mockUsers,
          error: null,
        }),
      });

      const users = await UserService.findAll();

      expect(users).toEqual(mockUsers);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const users = await UserService.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('findByLogin', () => {
    it('devrait retourner un utilisateur par login', async () => {
      const mockUser = {
        id: '1',
        login: 'testuser',
        email: 'test@example.com',
        status: 'utilisateur',
      };

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
      });

      const user = await UserService.findByLogin('testuser');

      expect(user).toEqual(mockUser);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            }),
          }),
        }),
      });

      const user = await UserService.findByLogin('nonexistent');

      expect(user).toBeNull();
    });
  });
});

