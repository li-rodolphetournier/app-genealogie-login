/**
 * Service pour la gestion des objets
 * Couche d'accès aux données (DAL) - Utilise Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ObjectData, ObjectCreateInput, ObjectUpdateInput, ObjectPhoto } from '@/types/objects';

export class ObjectService {
  /**
   * Récupérer tous les objets
   */
  static async findAll(): Promise<ObjectData[]> {
    const supabase = await createServiceRoleClient();
    const { data: objects, error } = await supabase
      .from('objects')
      .select(`
        *,
        object_photos (
          id,
          url,
          description,
          display_order
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des objets: ${error.message}`);
    }

    return (objects || []).map((obj: any) => {
      const photos: ObjectPhoto[] = (obj.object_photos || []).map((photo: any) => ({
        id: photo.id,
        url: photo.url,
        description: photo.description || [],
        display_order: photo.display_order || 0,
      })).sort((a: ObjectPhoto, b: ObjectPhoto) => (a.display_order || 0) - (b.display_order || 0));

      return {
        id: obj.id,
        nom: obj.nom,
        type: obj.type,
        status: obj.status as ObjectData['status'],
        description: obj.description || undefined,
        longDescription: obj.long_description || undefined,
        utilisateur: obj.utilisateur_id || '',
        utilisateur_id: obj.utilisateur_id || undefined,
        photos: photos.length > 0 ? photos : undefined,
        createdAt: obj.created_at,
        updatedAt: obj.updated_at,
      };
    });
  }

  /**
   * Récupérer un objet par ID
   */
  static async findById(id: string): Promise<ObjectData | null> {
    const supabase = await createServiceRoleClient();
    const { data: object, error } = await supabase
      .from('objects')
      .select(`
        *,
        object_photos (
          id,
          url,
          description,
          display_order
        )
      `)
      .eq('id', id)
      .single();

    if (error || !object) {
      return null;
    }

    const photos: ObjectPhoto[] = (object.object_photos || []).map((photo: any) => ({
      id: photo.id,
      url: photo.url,
      description: photo.description || [],
      display_order: photo.display_order || 0,
    })).sort((a: ObjectPhoto, b: ObjectPhoto) => (a.display_order || 0) - (b.display_order || 0));

    return {
      id: object.id,
      nom: object.nom,
      type: object.type,
      status: object.status as ObjectData['status'],
      description: object.description || undefined,
      longDescription: object.long_description || undefined,
      utilisateur: object.utilisateur_id || '',
      utilisateur_id: object.utilisateur_id || undefined,
      photos: photos.length > 0 ? photos : undefined,
      createdAt: object.created_at,
      updatedAt: object.updated_at,
    };
  }

  /**
   * Créer un objet
   */
  static async create(input: ObjectCreateInput): Promise<ObjectData> {
    const supabase = await createServiceRoleClient();

    // Récupérer l'ID utilisateur depuis le login si nécessaire
    let utilisateurId: string | null = null;
    if (input.utilisateur) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', input.utilisateur)
        .single();
      utilisateurId = user?.id || null;
    }

    const objectId = Date.now().toString();
    const { data: newObject, error: objectError } = await supabase
      .from('objects')
      .insert({
        id: objectId,
        nom: input.nom,
        type: input.type,
        status: input.status,
        utilisateur_id: utilisateurId,
        description: input.description || null,
        long_description: input.longDescription || null,
      })
      .select()
      .single();

    if (objectError || !newObject) {
      throw new Error(`Erreur lors de la création de l'objet: ${objectError?.message || 'Erreur inconnue'}`);
    }

    // Créer les photos si présentes
    if (input.photos && input.photos.length > 0) {
      const photosToInsert = input.photos.map((photo, index) => ({
        object_id: objectId,
        url: photo.url,
        description: photo.description || [],
        display_order: photo.display_order || index,
      }));

      const { error: photosError } = await supabase
        .from('object_photos')
        .insert(photosToInsert);

      if (photosError) {
        // Supprimer l'objet si les photos échouent
        await supabase.from('objects').delete().eq('id', objectId);
        throw new Error(`Erreur lors de la création des photos: ${photosError.message}`);
      }
    }

    // Récupérer l'objet complet
    const complete = await this.findById(objectId);
    if (!complete) {
      throw new Error('Erreur lors de la récupération de l\'objet créé');
    }

    return complete;
  }

  /**
   * Mettre à jour un objet
   */
  static async update(id: string, input: ObjectUpdateInput): Promise<ObjectData> {
    const supabase = await createServiceRoleClient();

    const updateData: Record<string, any> = {};
    if (input.nom !== undefined) updateData.nom = input.nom;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.longDescription !== undefined) updateData.long_description = input.longDescription || null;
    if (input.utilisateur !== undefined) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', input.utilisateur)
        .single();
      updateData.utilisateur_id = user?.id || null;
    }

    const { error: updateError } = await supabase
      .from('objects')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`);
    }

    // Mettre à jour les photos si présentes
    if (input.photos !== undefined) {
      await supabase.from('object_photos').delete().eq('object_id', id);
      if (input.photos.length > 0) {
        const photosToInsert = input.photos.map((photo, index) => ({
          object_id: id,
          url: photo.url,
          description: photo.description || [],
          display_order: photo.display_order || index,
        }));
        await supabase.from('object_photos').insert(photosToInsert);
      }
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Erreur lors de la récupération de l\'objet mis à jour');
    }

    return updated;
  }

  /**
   * Supprimer un objet
   */
  static async delete(id: string): Promise<void> {
    const supabase = await createServiceRoleClient();
    const { error } = await supabase.from('objects').delete().eq('id', id);
    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`);
    }
  }
}
