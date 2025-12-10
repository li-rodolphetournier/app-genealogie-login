/**
 * Tests pour le service de généalogie
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GenealogyService } from '../genealogy.service';
import type { Person } from '@/types/genealogy';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

describe('GenealogyService', () => {
  const mockSupabaseClient = {
    from: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    single: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createServiceRoleClient } = await import('@/lib/supabase/server');
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabaseClient as any);
    mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.order.mockReturnValue(mockSupabaseClient);
    mockSupabaseClient.single.mockReturnValue(mockSupabaseClient);
  });

  describe('findAll', () => {
    it('doit retourner toutes les personnes', async () => {
      const mockData = [
        {
          id: '1',
          nom: 'Dupont',
          prenom: 'Jean',
          genre: 'homme',
          description: '',
          mere_id: null,
          pere_id: null,
          ordre_naissance: 1,
          date_naissance: '1990-01-01',
          date_deces: null,
          image: null,
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      const result = await GenealogyService.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].nom).toBe('Dupont');
    });
  });

  describe('create', () => {
    it('doit créer une personne avec tous les champs', async () => {
      const newPerson: Person = {
        id: 'new-id',
        nom: 'Martin',
        prenom: 'Paul',
        genre: 'homme',
        description: 'Test',
        mere: 'mother-id',
        pere: 'father-id',
        ordreNaissance: 2,
        dateNaissance: '1995-01-01',
        dateDeces: null,
        image: 'https://example.com/image.jpg',
      };

      const mockInserted = {
        id: 'new-id',
        nom: 'Martin',
        prenom: 'Paul',
        genre: 'homme',
        description: 'Test',
        mere_id: 'mother-id',
        pere_id: 'father-id',
        ordre_naissance: 2,
        date_naissance: '1995-01-01',
        date_deces: null,
        image: 'https://example.com/image.jpg',
      };

      mockSupabaseClient.insert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockInserted, error: null }),
        }),
      });

      const result = await GenealogyService.create(newPerson);
      expect(result.nom).toBe('Martin');
      expect(result.pere).toBe('father-id');
      expect(result.mere).toBe('mother-id');
    });
  });

  describe('update', () => {
    it('doit mettre à jour uniquement les champs fournis', async () => {
      const updateData: Partial<Person> = {
        nom: 'NouveauNom',
        prenom: 'NouveauPrenom',
      };

      // Mock pour l'update
      mockSupabaseClient.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      // Mock pour le findById appelé après l'update
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: '1',
              nom: 'NouveauNom',
              prenom: 'NouveauPrenom',
              genre: 'homme',
              description: '',
              mere_id: null,
              pere_id: null,
              ordre_naissance: 1,
              date_naissance: '1990-01-01',
              date_deces: null,
              image: null,
            },
            error: null,
          }),
        }),
      });

      // Pour le deuxième appel à from (findById), on retourne un mock avec select
      mockSupabaseClient.from
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        })
        .mockReturnValueOnce({
          select: mockSelect,
        });

      const result = await GenealogyService.update('1', updateData);
      expect(result.nom).toBe('NouveauNom');
      expect(result.prenom).toBe('NouveauPrenom');
    });
  });

  describe('delete', () => {
    it('doit supprimer une personne', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(GenealogyService.delete('1')).resolves.not.toThrow();
    });
  });
});

