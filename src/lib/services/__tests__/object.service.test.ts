/**
 * Tests unitaires pour ObjectService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectService } from '../object.service';
import fs from 'fs/promises';
import path from 'path';

// Mock du système de fichiers
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

vi.mock('path', () => ({
  default: {
    join: vi.fn(() => '/test/objects.json'),
  },
}));

describe('ObjectService', () => {
  const mockObjects = [
    {
      id: '1',
      nom: 'Object 1',
      type: 'Type 1',
      status: 'disponible' as const,
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      nom: 'Object 2',
      type: 'Type 2',
      status: 'emprunté' as const,
      createdAt: '2024-01-02',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('devrait retourner tous les objets', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockObjects));

      const objects = await ObjectService.findAll();

      expect(objects).toHaveLength(2);
      expect(objects[0].nom).toBe('Object 1');
    });

    it('devrait retourner un tableau vide si le fichier n\'existe pas', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (fs.readFile as any).mockRejectedValue(error);

      const objects = await ObjectService.findAll();

      expect(objects).toEqual([]);
    });
  });

  describe('findById', () => {
    it('devrait retourner un objet par ID', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockObjects));

      const object = await ObjectService.findById('1');

      expect(object).not.toBeNull();
      expect(object?.nom).toBe('Object 1');
    });

    it('devrait retourner null si l\'objet n\'existe pas', async () => {
      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockObjects));

      const object = await ObjectService.findById('999');

      expect(object).toBeNull();
    });
  });
});

