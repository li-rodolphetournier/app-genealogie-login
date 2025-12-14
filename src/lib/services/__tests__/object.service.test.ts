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
  let mockSupabaseClient: {
    from: ReturnType<typeof vi.fn>;
  };
  
  beforeEach(() => {
    mockSupabaseClient = {
      from: vi.fn(),
    };
  });

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
    mockSupabaseClient = {
      from: vi.fn(),
    };
    (createServiceRoleClient as any).mockResolvedValue(mockSupabaseClient);
  });

  describe('findAll', () => {
    it('devrait retourner tous les objets', async () => {
      const mockUsers = [
        { id: 'user1', login: 'user1' },
        { id: 'user2', login: 'user2' },
      ];

      // Premier appel: from('objects') pour récupérer les objets
      // Deuxième appel: from('users') pour récupérer les logins des utilisateurs
      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockObjects,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: mockUsers,
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
      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockObjects[0],
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce(mockUserQuery);

      const object = await ObjectService.findById('1');

      expect(object).not.toBeNull();
      expect(object?.nom).toBe('Object 1');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('objects');
    });

    it('devrait retourner un objet par ID avec utilisateur', async () => {
      const objectWithUser = {
        ...mockObjects[0],
        utilisateur_id: 'user-id',
      };

      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { login: 'testuser' },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: objectWithUser,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce(mockUserQuery);

      const object = await ObjectService.findById('1');

      expect(object).not.toBeNull();
      expect(object?.utilisateur).toBe('testuser');
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

  describe('create', () => {
    it('devrait créer un objet avec succès', async () => {
      const newObjectId = '1234567890';
      const mockNewObject = {
        id: newObjectId,
        nom: 'Nouvel objet',
        type: 'Type test',
        status: 'disponible' as const,
        description: 'Description test',
        long_description: null,
        utilisateur_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        object_photos: [],
      };

      // Mock pour créer l'objet - from('objects') doit retourner un objet avec insert()
      const mockSelectAfterInsert = {
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockSelectAfterInsert),
        }),
      };

      // Mock pour findById (appelé après création)
      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };

      // Mock pour la requête utilisateur dans findById
      const mockUserInFindById = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // L'ordre des appels from() dans create():
      // 1. from('objects') - insert() pour créer l'objet (pas d'utilisateur fourni, donc pas de from('users'))
      // 2. from('objects') - findById() pour récupérer l'objet créé
      // 3. from('users') - dans findById() pour récupérer le login utilisateur
      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery) // 1. Insertion objet (from('objects'))
        .mockReturnValueOnce(mockFindByIdQuery) // 2. Récupération objet créé (from('objects') dans findById)
        .mockReturnValueOnce(mockUserInFindById); // 3. Récupération utilisateur dans findById (from('users'))

      const input = {
        nom: 'Nouvel objet',
        type: 'Type test',
        status: 'disponible' as const,
        description: 'Description test',
      };

      const result = await ObjectService.create(input);

      expect(result).not.toBeNull();
      expect(result.nom).toBe('Nouvel objet');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('objects');
    });

    it('devrait créer un objet avec utilisateur', async () => {
      const newObjectId = '1234567890';
      const mockNewObject = {
        id: newObjectId,
        nom: 'Nouvel objet',
        type: 'Type test',
        status: 'disponible' as const,
        description: null,
        long_description: null,
        utilisateur_id: 'user-id',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        object_photos: [],
      };

      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id' },
          error: null,
        }),
      };

      const mockSelectAfterInsert = {
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockSelectAfterInsert),
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };

      const mockUserInFindById = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { login: 'testuser' },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserQuery)
        .mockReturnValueOnce(mockInsertQuery)
        .mockReturnValueOnce(mockFindByIdQuery)
        .mockReturnValueOnce(mockUserInFindById);

      const input = {
        nom: 'Nouvel objet',
        type: 'Type test',
        status: 'disponible' as const,
        utilisateur: 'testuser',
      };

      const result = await ObjectService.create(input);

      expect(result).not.toBeNull();
      expect(result.utilisateur).toBe('testuser');
    });

    it('devrait gérer les erreurs lors de la création de photos', async () => {
      const newObjectId = '1234567890';
      const mockNewObject = {
        id: newObjectId,
        nom: 'Objet avec photos',
        type: 'Type test',
        status: 'disponible' as const,
        description: null,
        long_description: null,
        utilisateur_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        object_photos: [],
      };

      const mockSelectAfterInsert = {
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockSelectAfterInsert),
        }),
      };

      const mockPhotosInsertQuery = {
        insert: vi.fn().mockResolvedValue({ 
          data: null,
          error: { message: 'Photo error' } 
        }),
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      // L'ordre des appels from() dans create() avec photos qui échouent:
      // 1. from('objects') - insert() pour créer l'objet
      // 2. from('object_photos') - insert() pour créer les photos (échoue)
      // 3. from('objects') - delete() pour supprimer l'objet en cas d'erreur
      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery) // 1. Insertion objet
        .mockReturnValueOnce(mockPhotosInsertQuery) // 2. Insertion photos (échoue)
        .mockReturnValueOnce(mockDeleteQuery); // 3. Suppression de l'objet en cas d'erreur

      const input = {
        nom: 'Objet avec photos',
        type: 'Type test',
        status: 'disponible' as const,
        photos: [{ url: 'photo1.jpg', description: [], display_order: 0 }],
      };

      await expect(ObjectService.create(input)).rejects.toThrow('Erreur lors de la création des photos');
    });

    it('devrait gérer les erreurs lors de la récupération après création', async () => {
      const newObjectId = '1234567890';
      const mockNewObject = {
        id: newObjectId,
        nom: 'Nouvel objet',
        type: 'Type test',
        status: 'disponible' as const,
        description: null,
        long_description: null,
        utilisateur_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        object_photos: [],
      };

      const mockSelectAfterInsert = {
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockSelectAfterInsert),
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // L'ordre des appels from() dans create():
      // 1. from('objects') - insert() pour créer l'objet
      // 2. from('objects') - findById() pour récupérer l'objet créé (retourne null)
      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery) // 1. Insertion objet
        .mockReturnValueOnce(mockFindByIdQuery); // 2. Récupération objet créé (retourne null)

      const input = {
        nom: 'Nouvel objet',
        type: 'Type test',
        status: 'disponible' as const,
      };

      await expect(ObjectService.create(input)).rejects.toThrow('Erreur lors de la récupération');
    });

    it('devrait créer un objet avec photos', async () => {
      const newObjectId = '1234567890';
      const mockNewObject = {
        id: newObjectId,
        nom: 'Objet avec photos',
        type: 'Type test',
        status: 'disponible' as const,
        description: null,
        long_description: null,
        utilisateur_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        object_photos: [
          { id: '1', url: 'photo1.jpg', description: [], display_order: 0 },
        ],
      };

      const mockSelectAfterInsert = {
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockSelectAfterInsert),
        }),
      };

      // Mock pour from('object_photos') - doit retourner un objet avec insert()
      const mockPhotosInsertQuery = {
        insert: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockNewObject,
          error: null,
        }),
      };

      const mockUserInFindById = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // L'ordre des appels from() dans create() avec photos:
      // 1. from('objects') - insert() pour créer l'objet
      // 2. from('object_photos') - insert() pour créer les photos
      // 3. from('objects') - findById() pour récupérer l'objet créé
      // 4. from('users') - dans findById() pour récupérer le login utilisateur
      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery) // 1. Insertion objet
        .mockReturnValueOnce(mockPhotosInsertQuery) // 2. Insertion photos
        .mockReturnValueOnce(mockFindByIdQuery) // 3. Récupération objet créé
        .mockReturnValueOnce(mockUserInFindById); // 4. Récupération utilisateur dans findById

      const input = {
        nom: 'Objet avec photos',
        type: 'Type test',
        status: 'disponible' as const,
        photos: [{ url: 'photo1.jpg', description: [], display_order: 0 }],
      };

      const result = await ObjectService.create(input);

      expect(result).not.toBeNull();
      expect(mockPhotosInsertQuery.insert).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la création', async () => {
      const mockSelectAfterInsert = {
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };
      const mockInsertQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue(mockSelectAfterInsert),
        }),
      };

      // L'ordre des appels from() dans create() avec erreur:
      // 1. from('objects') - insert() pour créer l'objet (échoue)
      mockSupabaseClient.from
        .mockReturnValueOnce(mockInsertQuery); // 1. Insertion objet (échoue)

      const input = {
        nom: 'Objet test',
        type: 'Type test',
        status: 'disponible' as const,
      };

      await expect(ObjectService.create(input)).rejects.toThrow('Erreur lors de la création de l\'objet');
    });
  });

  describe('update', () => {
    it('devrait mettre à jour un objet avec succès', async () => {
      const updatedObject = {
        id: '1',
        nom: 'Objet mis à jour',
        type: 'Type modifié',
        status: 'emprunté' as const,
        description: 'Nouvelle description',
        long_description: null,
        utilisateur_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        object_photos: [],
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedObject,
          error: null,
        }),
      };

      const mockUserInFindById = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      // L'ordre des appels from() dans update():
      // 1. from('users') - si utilisateur fourni dans input
      // 2. from('objects') - update() pour mettre à jour l'objet
      // 3. from('object_photos') - delete() si photos présentes
      // 4. from('object_photos') - insert() si photos présentes
      // 5. from('objects') - findById() pour récupérer l'objet mis à jour
      // 6. from('users') - dans findById() pour récupérer le login utilisateur
      mockSupabaseClient.from
        .mockReturnValueOnce(mockUpdateQuery) // 1. Update objet (from('objects'))
        .mockReturnValueOnce(mockFindByIdQuery) // 2. Récupération objet mis à jour (from('objects') dans findById)
        .mockReturnValueOnce(mockUserInFindById); // 3. Récupération utilisateur dans findById (from('users'))

      const input = {
        nom: 'Objet mis à jour',
        type: 'Type modifié',
        status: 'emprunté' as const,
        description: 'Nouvelle description',
      };

      const result = await ObjectService.update('1', input);

      expect(result).not.toBeNull();
      expect(result.nom).toBe('Objet mis à jour');
      expect(mockUpdateQuery.update).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la mise à jour', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Update error' },
          }),
        }),
      };

      mockSupabaseClient.from.mockReturnValueOnce(mockUpdateQuery);

      const input = { nom: 'Nouveau nom' };

      await expect(ObjectService.update('1', input)).rejects.toThrow('Erreur lors de la mise à jour');
    });

    it('devrait mettre à jour un objet avec photos', async () => {
      const updatedObject = {
        id: '1',
        nom: 'Objet avec photos',
        type: 'Type test',
        status: 'disponible' as const,
        description: null,
        long_description: null,
        utilisateur_id: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        object_photos: [
          { id: '1', url: 'photo1.jpg', description: [], display_order: 0 },
        ],
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            data: null,
            error: null 
          }),
        }),
      };

      const mockPhotosDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            data: null,
            error: null 
          }),
        }),
      };

      const mockPhotosInsertQuery = {
        insert: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedObject,
          error: null,
        }),
      };

      const mockUserInFindById = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockUpdateQuery) // Update objet
        .mockReturnValueOnce(mockPhotosDeleteQuery) // Delete photos
        .mockReturnValueOnce(mockPhotosInsertQuery) // Insert photos
        .mockReturnValueOnce(mockFindByIdQuery) // Récupération objet mis à jour
        .mockReturnValueOnce(mockUserInFindById); // Récupération utilisateur

      const input = {
        photos: [{ url: 'photo1.jpg', description: [], display_order: 0 }],
      };

      const result = await ObjectService.update('1', input);

      expect(result).not.toBeNull();
      expect(mockPhotosDeleteQuery.delete).toHaveBeenCalled();
      expect(mockPhotosInsertQuery.insert).toHaveBeenCalled();
    });

    it('devrait mettre à jour un objet avec utilisateur', async () => {
      const updatedObject = {
        id: '1',
        nom: 'Objet mis à jour',
        type: 'Type test',
        status: 'disponible' as const,
        description: null,
        long_description: null,
        utilisateur_id: 'user-id',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
        object_photos: [],
      };

      const mockUserQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'user-id' },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: updatedObject,
          error: null,
        }),
      };

      const mockUserInFindById = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { login: 'testuser' },
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockUserQuery) // Vérification utilisateur
        .mockReturnValueOnce(mockUpdateQuery) // Update objet
        .mockReturnValueOnce(mockFindByIdQuery) // Récupération objet mis à jour
        .mockReturnValueOnce(mockUserInFindById); // Récupération utilisateur

      const input = {
        utilisateur: 'testuser',
      };

      const result = await ObjectService.update('1', input);

      expect(result).not.toBeNull();
      expect(mockUserQuery.select).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la récupération après mise à jour', async () => {
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      const mockFindByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      };

      mockSupabaseClient.from
        .mockReturnValueOnce(mockUpdateQuery)
        .mockReturnValueOnce(mockFindByIdQuery);

      const input = { nom: 'Nouveau nom' };

      await expect(ObjectService.update('1', input)).rejects.toThrow('Erreur lors de la récupération');
    });
  });

  describe('delete', () => {
    it('devrait supprimer un objet avec succès', async () => {
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ 
          data: null,
          error: null 
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDeleteQuery);

      await ObjectService.delete('1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('objects');
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
      expect(mockDeleteQuery.eq).toHaveBeenCalledWith('id', '1');
    });

    it('devrait gérer les erreurs lors de la suppression', async () => {
      const mockDeleteQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Delete error' },
          }),
        }),
      };

      mockSupabaseClient.from.mockReturnValue(mockDeleteQuery);

      await expect(ObjectService.delete('1')).rejects.toThrow('Erreur lors de la suppression');
    });
  });
});
