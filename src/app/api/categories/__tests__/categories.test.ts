/**
 * Tests pour les routes /api/categories et /api/categories/[id]
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as rootRoute from '../route';
import * as idRoute from '../[id]/route';
import { createServiceRoleClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

const createServiceSupabaseMock = () => ({
  from: vi.fn(),
});

describe('API Categories', () => {
  const mockSupabase = createServiceSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(mockSupabase as any);
  });

  describe('GET /api/categories', () => {
    it('devrait retourner la liste des catégories depuis object_categories', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: '1',
                name: 'Cat A',
                description: 'Desc',
                created_at: '2024-01-01',
                updated_at: '2024-01-02',
              },
            ],
            error: null,
          }),
        }),
      });

      const response = await rootRoute.GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.categories).toHaveLength(1);
      expect(data.categories[0].name).toBe('Cat A');
    });

    it('devrait utiliser le fallback sur les types d’objets si aucune catégorie', async () => {
      // Premier appel: object_categories vide
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        // Deuxième appel: objects avec type
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            not: vi.fn().mockReturnValue({
              select: undefined,
              data: [
                { type: 'Type1' },
                { type: 'Type2' },
                { type: 'Type1' },
              ],
            } as any),
          }),
        } as any);

      const response = await rootRoute.GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.legacy).toBe(true);
      expect(data.categories.map((c: any) => c.name).sort()).toEqual(['Type1', 'Type2']);
    });
  });

  describe('POST /api/categories', () => {
    it('devrait retourner 400 si les données sont invalides', async () => {
      const request = new Request('http://localhost/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      });

      const response = await rootRoute.POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Données invalides');
    });
  });

  describe('/api/categories/[id]', () => {
    const createContext = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    it('GET devrait retourner 404 si la catégorie est introuvable', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      const response = await idRoute.GET(
        new Request('http://localhost/api/categories/1'),
        createContext('1'),
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Catégorie non trouvée');
    });

    it('DELETE devrait refuser la suppression si des objets utilisent la catégorie', async () => {
      // Récupération de la catégorie
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: '1', name: 'Cat A' },
                error: null,
              }),
            }),
          }),
        })
        // Vérification des objets
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ id: 'obj1', nom: 'Objet 1' }],
              error: null,
            }),
          }),
        });

      const response = await idRoute.DELETE(
        new Request('http://localhost/api/categories/1'),
        createContext('1'),
      );
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('ne peut pas être supprimée');
    });
  });
});


