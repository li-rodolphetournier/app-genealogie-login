/**
 * Tests unitaires pour UserService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../user.service';
import fs from 'fs/promises';
import path from 'path';

// Mock du système de fichiers
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

// Mock de path
vi.mock('path', () => ({
  default: {
    join: vi.fn(() => '/test/users.json'),
  },
}));

describe('UserService', () => {
  const mockUsers = [
    {
      id: '1',
      login: 'user1',
      email: 'user1@example.com',
      status: 'utilisateur' as const,
      password: 'hashed1',
    },
    {
      id: '2',
      login: 'user2',
      email: 'user2@example.com',
      status: 'administrateur' as const,
      password: 'hashed2',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('devrait retourner tous les utilisateurs', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockUsers));

      const users = await UserService.findAll();

      expect(users).toHaveLength(2);
      expect(users[0]).not.toHaveProperty('password');
      expect(users[1]).not.toHaveProperty('password');
      expect(users[0].login).toBe('user1');
      expect(users[1].login).toBe('user2');
    });

    it('devrait retourner un tableau vide si le fichier n\'existe pas', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (fs.readFile as any).mockRejectedValue(error);

      const users = await UserService.findAll();

      expect(users).toEqual([]);
    });
  });

  describe('findByLogin', () => {
    it('devrait retourner un utilisateur par login', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockUsers));

      const user = await UserService.findByLogin('user1');

      expect(user).not.toBeNull();
      expect(user?.login).toBe('user1');
      expect(user).not.toHaveProperty('password');
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockUsers));

      const user = await UserService.findByLogin('nonexistent');

      expect(user).toBeNull();
    });
  });
});

