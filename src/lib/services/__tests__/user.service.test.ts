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

  describe('findByLoginWithPassword', () => {
    it('devrait retourner null (compatibilité Supabase Auth)', async () => {
      const result = await UserService.findByLoginWithPassword('user1');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('devrait créer un utilisateur avec succès', async () => {
      const mockAuthUser = {
        user: {
          id: 'auth-user-id',
          email: 'newuser@example.com',
        },
      };

      const mockNewUser = {
        id: 'auth-user-id',
        login: 'newuser',
        email: 'newuser@example.com',
        status: 'utilisateur' as const,
        profile_image: null,
        description: null,
        detail: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null, // Pas d'utilisateur existant
          error: { code: 'PGRST116' }, // Not found
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewUser,
          error: null,
        }),
      };

      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      mockSupabaseClient.from
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const input = {
        login: 'newuser',
        email: 'newuser@example.com',
        status: 'utilisateur' as const,
        password: 'password123',
      };

      const result = await UserService.create(input);

      expect(result).not.toBeNull();
      expect(result.login).toBe('newuser');
      expect(result.email).toBe('newuser@example.com');
      expect(mockSupabaseClient.auth.admin.createUser).toHaveBeenCalled();
    });

    it('devrait rejeter si l\'utilisateur existe déjà', async () => {
      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { login: 'existing', email: 'existing@example.com' },
          error: null,
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockCheckQuery);

      const input = {
        login: 'existing',
        email: 'existing@example.com',
        status: 'utilisateur' as const,
        password: 'password123',
      };

      await expect(UserService.create(input)).rejects.toThrow('Utilisateur ou email déjà utilisé');
    });

    it('devrait gérer les erreurs lors de la création Auth', async () => {
      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockCheckQuery);
      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: null,
        error: { message: 'Auth error' },
      });

      const input = {
        login: 'newuser',
        email: 'newuser@example.com',
        status: 'utilisateur' as const,
        password: 'password123',
      };

      await expect(UserService.create(input)).rejects.toThrow('Erreur lors de la création de l\'utilisateur');
    });

    it('devrait nettoyer l\'utilisateur Auth si la création du profil échoue', async () => {
      const mockAuthUser = {
        user: {
          id: 'auth-user-id',
          email: 'newuser@example.com',
        },
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile creation error' },
        }),
      };

      mockSupabaseClient.auth.admin.createUser.mockResolvedValue({
        data: mockAuthUser,
        error: null,
      });

      mockSupabaseClient.from
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockInsertQuery);

      const input = {
        login: 'newuser',
        email: 'newuser@example.com',
        status: 'utilisateur' as const,
        password: 'password123',
      };

      await expect(UserService.create(input)).rejects.toThrow('Erreur lors de la création du profil');
      expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith('auth-user-id');
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un utilisateur avec succès', async () => {
      const mockExistingUser = {
        id: 'user-id',
      };

      const mockUpdatedUser = {
        id: 'user-id',
        login: 'user1',
        email: 'updated@example.com',
        status: 'administrateur' as const,
        profile_image: null,
        description: 'Nouvelle description',
        detail: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExistingUser,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUpdatedUser,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const input = {
        email: 'updated@example.com',
        status: 'administrateur' as const,
        description: 'Nouvelle description',
      };

      const result = await UserService.update('user1', input);

      expect(result).not.toBeNull();
      expect(result.email).toBe('updated@example.com');
      expect(result.status).toBe('administrateur');
    });

    it('devrait rejeter si l\'utilisateur n\'existe pas', async () => {
      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockCheckQuery);

      const input = { email: 'updated@example.com' };

      await expect(UserService.update('nonexistent', input)).rejects.toThrow('Utilisateur non trouvé');
    });

    it('devrait gérer les erreurs lors de la mise à jour', async () => {
      const mockExistingUser = { id: 'user-id' };

      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockExistingUser,
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update error' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockCheckQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      const input = { email: 'updated@example.com' };

      await expect(UserService.update('user1', input)).rejects.toThrow('Erreur lors de la mise à jour');
    });
  });

  describe('delete', () => {
    it('devrait supprimer un utilisateur avec succès', async () => {
      const mockUser = { id: 'user-id' };

      const mockFindQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockFindQuery)
        .mockReturnValueOnce(mockDeleteQuery);

      await UserService.delete('user1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
    });

    it('devrait rejeter si l\'utilisateur n\'existe pas', async () => {
      const mockFindQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockFindQuery);

      await expect(UserService.delete('nonexistent')).rejects.toThrow('Utilisateur non trouvé');
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      const mockUser = { id: 'user-id' };

      const mockFindQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockUser,
          error: null,
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: { message: 'Delete error' },
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockFindQuery)
        .mockReturnValueOnce(mockDeleteQuery);

      await expect(UserService.delete('user1')).rejects.toThrow('Erreur lors de la suppression');
    });
  });
});

