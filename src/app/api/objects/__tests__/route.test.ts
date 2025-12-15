import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as rootRoute from '../route';
import * as idRoute from '../[id]/route';
import * as photosRoute from '../[id]/photos/route';
import * as historyRoute from '../history/route';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, requireRedactor, requireAdmin } from '@/lib/auth/middleware';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(),
  requireRedactor: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

const createSupabaseMock = () => ({
  from: vi.fn(),
});

describe('API Objects', () => {
  const supabase = createSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockResolvedValue(supabase as any);
  });

  describe('GET /api/objects', () => {
    it('retourne la liste mappée des objets avec leurs photos', async () => {
      supabase.from
        // objects
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'obj1',
                  nom: 'Objet 1',
                  type: 'typeA',
                  status: 'publie',
                  description: 'desc',
                  long_description: null,
                  utilisateur_id: 'user1',
                  created_at: '2024-01-01',
                  updated_at: '2024-01-02',
                  object_photos: [
                    {
                      id: 'p1',
                      url: '/img/p1.jpg',
                      description: ['d1'],
                      display_order: 1,
                    },
                  ],
                },
              ],
              error: null,
            }),
          }),
        })
        // users
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ id: 'user1', login: 'alice' }],
              error: null,
            }),
          }),
        } as any);

      const response = await rootRoute.GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0]).toEqual(
        expect.objectContaining({
          id: 'obj1',
          nom: 'Objet 1',
          utilisateur: 'alice',
        }),
      );
      expect(data[0].photos[0].url).toBe('/img/p1.jpg');
    });
  });

  describe('POST /api/objects', () => {
    it('retourne 401 si non authentifié', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: null } as any);

      const request = new Request('http://localhost/api/objects', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await rootRoute.POST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/connecté/);
    });

    it('retourne 403 si utilisateur non administrateur ou rédacteur', async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: 'u1', status: 'utilisateur' },
      } as any);

      const request = new Request('http://localhost/api/objects', {
        method: 'POST',
        body: JSON.stringify({ nom: 'x', type: 't', status: 'publie' }),
      });

      const response = await rootRoute.POST(request as any);
      expect(response.status).toBe(403);
    });
  });

  describe('/api/objects/[id]', () => {
    const createContext = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    it('GET retourne 404 si l’objet est introuvable', async () => {
      supabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      });

      const response = await idRoute.GET(
        new Request('http://localhost/api/objects/obj1'),
        createContext('obj1') as any,
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('PUT retourne 400 si le corps est vide', async () => {
      vi.mocked(requireRedactor).mockResolvedValue({ id: 'u1' } as any);

      const response = await idRoute.PUT(
        new Request('http://localhost/api/objects/obj1', {
          method: 'PUT',
          body: '',
        }),
        createContext('obj1') as any,
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('corps de la requête est vide');
    });
  });

  describe('/api/objects/[id]/photos', () => {
    const createContext = (id: string) => ({
      params: Promise.resolve({ id }),
    });

    it('POST retourne 400 si photos manquantes', async () => {
      const request = new Request('http://localhost/api/objects/obj1/photos', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await photosRoute.POST(request as any, createContext('obj1') as any);
      expect(response.status).toBe(400);
    });

    it('DELETE retourne 400 si photoId est manquant', async () => {
      const request = new Request('http://localhost/api/objects/obj1/photos', {
        method: 'DELETE',
      });

      const response = await photosRoute.DELETE(request as any, createContext('obj1') as any);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/objects/history', () => {
    it('retourne 401 si requireAdmin lance "Non authentifié"', async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new Error('Non authentifié'));

      const request = new Request('http://localhost/api/objects/history');
      const response = await historyRoute.GET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Non authentifié');
    });
  });
});


