/**
 * Tests unitaires pour UserService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../user.service';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('UserService', () => {
  const mockUsers = [
    {
      id: '1',
      login: 'user1',
      email: 'user1@example.com',
      status: 'utilisateur' as const,
      profile_image: null,
      description: null,
      detail: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      login: 'user2',
      email: 'user2@example.com',
      status: 'administrateur' as const,
      profile_image: null,
      description: null,
      detail: null,
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockSupabaseClient = {
    from: vi.fn(),
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
    (createServiceRoleClient as any).mockResolvedValue(mockSupabaseClient);
  });

  describe('findAll', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockUsers,
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const users = await UserService.findAll();

      expect(users).toHaveLength(2);
      expect(users[0].login).toBe('user1');
      expect(users[1].login).toBe('user2');
      expect(users[0]).not.toHaveProperty('password');
      expect(users[1]).not.toHaveProperty('password');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('devrait retourner un tableau vide si la requête échoue', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(UserService.findAll()).rejects.toThrow('Erreur lors de la récupération des utilisateurs');
    });

    it('devrait retourner un tableau vide si aucune donnée n\'est retournée', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const users = await UserService.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('findByLogin', () => {
    it('devrait retourner un utilisateur par login', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUsers[0],
          error: null,
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const user = await UserService.findByLogin('user1');

      expect(user).not.toBeNull();
      expect(user?.login).toBe('user1');
      expect(user?.email).toBe('user1@example.com');
      expect(user).not.toHaveProperty('password');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('login', 'user1');
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const user = await UserService.findByLogin('nonexistent');

      expect(user).toBeNull();
    });
  });
});

