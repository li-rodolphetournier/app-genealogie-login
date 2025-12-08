/**
 * Tests unitaires pour ObjectService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectService } from '../object.service';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Mock du client Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('ObjectService', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
  };

  const mockObjects = [
    {
      id: '1',
      nom: 'Object 1',
      type: 'Type 1',
      status: 'disponible' as const,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      utilisateur_id: null,
      description: null,
      long_description: null,
      object_photos: [],
    },
    {
      id: '2',
      nom: 'Object 2',
      type: 'Type 2',
      status: 'emprunté' as const,
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
      utilisateur_id: null,
      description: null,
      long_description: null,
      object_photos: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (createServiceRoleClient as any).mockResolvedValue(mockSupabaseClient);
  });

  describe('findAll', () => {
    it('devrait retourner tous les objets', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockObjects,
            error: null,
          }),
        }),
      });

      const objects = await ObjectService.findAll();

      expect(objects).toHaveLength(2);
      expect(objects[0].nom).toBe('Object 1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('objects');
    });

    it('devrait retourner un tableau vide en cas d\'erreur', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      await expect(ObjectService.findAll()).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('devrait retourner un objet par ID', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockObjects[0],
              error: null,
            }),
          }),
        }),
      });

      const object = await ObjectService.findById('1');

      expect(object).not.toBeNull();
      expect(object?.nom).toBe('Object 1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('objects');
    });

    it('devrait retourner null si l\'objet n\'existe pas', async () => {
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

      const object = await ObjectService.findById('999');

      expect(object).toBeNull();
    });
  });
});

