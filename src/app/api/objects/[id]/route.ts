import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireRedactor } from '@/lib/auth/middleware';
import { objectUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { createErrorResponse } from '@/lib/api/error-handler';
import { determineUpdatedBy, logObjectHistory, detectChangedFields } from '@/lib/utils/history-helpers';
import { getErrorMessage } from '@/lib/errors/messages';
import { logger } from '@/lib/utils/logger';
import type { ObjectData, ObjectPhoto } from '@/types/objects';
import type { SupabaseObject, SupabaseObjectPhoto } from '@/types/supabase-objects';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET - Récupérer un objet par ID
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('OBJECT_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Récupérer le login de l'utilisateur depuis l'ID
    let utilisateurLogin = '';
    if (object.utilisateur_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('login')
        .eq('id', object.utilisateur_id)
        .single();
      
      // Ignorer l'erreur de récupération de l'utilisateur si elle existe
      utilisateurLogin = user?.login || '';
    }

    // Mapper vers ObjectData
    const photos: ObjectPhoto[] = (object.object_photos || []).map((photo: unknown) => {
      const photoData = photo as { id: string; url: string; description: string[]; display_order: number };
      return {
        id: photoData.id,
        url: photoData.url,
        description: photoData.description || [],
        display_order: photoData.display_order || 0,
      };
    }).sort((a: ObjectPhoto, b: ObjectPhoto) => (a.display_order || 0) - (b.display_order || 0));

    const objectData: ObjectData = {
      id: object.id,
      nom: object.nom,
      type: object.type,
      status: object.status as ObjectData['status'],
      description: object.description || undefined,
      longDescription: object.long_description || undefined,
      utilisateur: utilisateurLogin,
      utilisateur_id: object.utilisateur_id || undefined,
      photos: photos.length > 0 ? photos : undefined,
      createdAt: object.created_at,
      updatedAt: object.updated_at,
    };

    return NextResponse.json<ObjectData>(objectData, { status: 200 });
  } catch (error) {
    logger.error('[GET /api/objects/[id]] Erreur lors de la récupération de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un objet
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    // Vérifier les droits
    const user = await requireRedactor();
    const { id } = await context.params;
    
    // Vérifier que le body existe et est valide
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Le corps de la requête est vide' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
      
      // Si utilisateur est une chaîne vide, le retirer du body (ne pas mettre à jour)
      if (body.utilisateur === '' || (typeof body.utilisateur === 'string' && body.utilisateur.trim() === '')) {
        delete body.utilisateur;
      }
    } catch (parseError) {
      logger.error('[PUT /api/objects/[id]] Erreur de parsing JSON:', parseError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Format JSON invalide dans le corps de la requête' },
        { status: 400 }
      );
    }
    
    // Validation Zod
    const validation = validateWithSchema(objectUpdateSchema, body);
    if (!validation.success) {
      logger.error('[PUT /api/objects/[id]] Erreur de validation:', validation.error);
      return createValidationErrorResponse(validation.error);
    }
    
    const supabase = await createServiceRoleClient();

    // Vérifier que l'objet existe
    const { data: existingObject } = await supabase
      .from('objects')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingObject) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('OBJECT_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Partial<{
      nom: string;
      type: string;
      status: 'publie' | 'brouillon';
      description: string | null;
      long_description: string | null;
      utilisateur_id: string | null;
    }> = {};
    
    if (validation.data.nom !== undefined) updateData.nom = validation.data.nom;
    if (validation.data.type !== undefined) updateData.type = validation.data.type;
    if (validation.data.status !== undefined) updateData.status = validation.data.status;
    if (validation.data.description !== undefined) updateData.description = validation.data.description || null;
    if (validation.data.longDescription !== undefined) updateData.long_description = validation.data.longDescription || null;
    // Mettre à jour utilisateur seulement si fourni et non vide
    if (validation.data.utilisateur !== undefined && validation.data.utilisateur.trim() !== '') {
      // Récupérer l'ID utilisateur depuis le login
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', validation.data.utilisateur.trim())
        .single();
      updateData.utilisateur_id = user?.id || null;
    }

    // Récupérer l'objet avant modification pour l'historique
    const { data: oldObject } = await supabase
      .from('objects')
      .select('*')
      .eq('id', id)
      .single();

    // Mettre à jour l'objet
    const { data: updatedObject, error: updateError } = await supabase
      .from('objects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedObject) {
      logger.error('[PUT /api/objects/[id]] Erreur mise à jour objet:', updateError);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Enregistrer dans l'historique manuellement
    if (oldObject && updatedObject) {
      // Détecter les champs modifiés
      const changedFields: string[] = [];
      const fieldsToCheck = ['nom', 'type', 'status', 'description', 'long_description', 'utilisateur_id'];
      fieldsToCheck.forEach(field => {
        const oldValue = oldObject[field];
        const newValue = updatedObject[field];
        if (oldValue !== newValue) {
          changedFields.push(field);
        }
      });

      if (changedFields.length > 0) {
        const updatedBy = await determineUpdatedBy(supabase, user.id);
        
        await logObjectHistory(supabase, {
          object_id: id,
          action: 'updated',
          updated_at: new Date().toISOString(),
          old_values: oldObject,
          new_values: updatedObject,
          changed_fields: changedFields,
          updated_by: updatedBy,
        });
      }
    }

    // Mettre à jour les photos si présentes
    if (validation.data.photos !== undefined) {
      // Supprimer les anciennes photos
      await supabase
        .from('object_photos')
        .delete()
        .eq('object_id', id);

      // Insérer les nouvelles photos
      if (validation.data.photos.length > 0) {
        const photosToInsert = validation.data.photos.map((photo, index) => ({
          object_id: id,
          url: photo.url,
          description: photo.description || [],
          display_order: photo.display_order || index,
        }));

        const { error: photosError } = await supabase
          .from('object_photos')
          .insert(photosToInsert);

        if (photosError) {
          logger.error('[PUT /api/objects/[id]] Erreur mise à jour photos:', photosError);
        }
      }
    }

    // Récupérer l'objet complet avec photos
    const { data: completeObject } = await supabase
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

    // Récupérer le login de l'utilisateur depuis l'ID
    let utilisateurLogin = validation.data.utilisateur || '';
    if (!utilisateurLogin && completeObject!.utilisateur_id) {
      const { data: user } = await supabase
        .from('users')
        .select('login')
        .eq('id', completeObject!.utilisateur_id)
        .single();
      utilisateurLogin = user?.login || '';
    }

    // Mapper vers ObjectData
    const photos: ObjectPhoto[] = (completeObject!.object_photos || []).map((photo: unknown) => {
      const photoData = photo as { id: string; url: string; description: string[]; display_order: number };
      return {
        id: photoData.id,
        url: photoData.url,
        description: photoData.description || [],
        display_order: photoData.display_order || 0,
      };
    }).sort((a: ObjectPhoto, b: ObjectPhoto) => (a.display_order || 0) - (b.display_order || 0));

    const objectData: ObjectData = {
      id: completeObject!.id,
      nom: completeObject!.nom,
      type: completeObject!.type,
      status: completeObject!.status as ObjectData['status'],
      description: completeObject!.description || undefined,
      longDescription: completeObject!.long_description || undefined,
      utilisateur: utilisateurLogin,
      utilisateur_id: completeObject!.utilisateur_id || undefined,
      photos: photos.length > 0 ? photos : undefined,
      createdAt: completeObject!.created_at,
      updatedAt: completeObject!.updated_at,
    };

    // Revalider le cache
    revalidatePath('/objects', 'page');
    revalidatePath(`/objects/${id}`, 'page');

    return NextResponse.json<SuccessResponse<ObjectData>>(
      { message: 'Objet mis à jour avec succès', data: objectData },
      { status: 200 }
    );
  } catch (error: unknown) {
    return createErrorResponse(error, 500, {
      route: '/api/objects/[id]',
      operation: 'PUT',
    });
  }
}

// DELETE - Supprimer un objet
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    // Vérifier les droits
    const user = await requireRedactor();
    const { id } = await context.params;
    const supabase = await createServiceRoleClient();

    // Vérifier que l'objet existe et récupérer ses données pour l'historique
    const { data: existingObject } = await supabase
      .from('objects')
      .select('*')
      .eq('id', id)
      .single();

    if (!existingObject) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('OBJECT_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Enregistrer dans l'historique AVANT de supprimer (pour avoir object_id valide)
    const updatedBy = await determineUpdatedBy(supabase, user.id);
    
    await logObjectHistory(supabase, {
      object_id: id,
      action: 'deleted',
      updated_at: new Date().toISOString(),
      old_values: existingObject,
      changed_fields: ['objet_supprimé'],
      updated_by: updatedBy,
    });

    // Supprimer l'objet (les photos seront supprimées automatiquement grâce à CASCADE)
    // Le trigger essaiera aussi d'enregistrer, mais on a déjà fait l'insertion manuellement
    // Le trigger utilisera object_id = NULL pour éviter la contrainte FK
    const { error: deleteError } = await supabase
      .from('objects')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('[DELETE /api/objects/[id]] Erreur suppression objet:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Revalider le cache
    revalidatePath('/objects', 'page');
    revalidatePath(`/objects/${id}`, 'page');

    return NextResponse.json<SuccessResponse>(
      { message: 'Objet supprimé avec succès' },
      { status: 200 }
    );
  } catch (error: unknown) {
    return createErrorResponse(error, 500, {
      route: '/api/objects/[id]',
      operation: 'DELETE',
    });
  }
}
