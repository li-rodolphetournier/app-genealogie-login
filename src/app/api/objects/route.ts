import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { objectCreateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { createErrorResponse } from '@/lib/api/error-handler';
import { determineUpdatedBy, logObjectHistory } from '@/lib/utils/history-helpers';
import { getErrorMessage } from '@/lib/errors/messages';
import { logger } from '@/lib/utils/logger';
import type { ObjectData, ObjectPhoto } from '@/types/objects';
import type { SupabaseObject, SupabaseObjectPhoto, SupabaseUser } from '@/types/supabase-objects';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

// GET - Récupérer tous les objets
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    // Récupérer les objets avec leurs photos
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
      console.error('Erreur Supabase lors de la récupération des objets:', error);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Récupérer tous les IDs utilisateurs uniques
    const userIds = [...new Set((objects || []).map((obj: unknown) => (obj as { utilisateur_id: string | null }).utilisateur_id).filter(Boolean))];
    
    // Récupérer les logins des utilisateurs en une seule requête
    const { data: users } = await supabase
      .from('users')
      .select('id, login')
      .in('id', userIds);
    
    const userLoginMap = new Map((users || []).map((u: unknown) => {
      const user = u as { id: string; login: string };
      return [user.id, user.login];
    }));

    // Mapper les données Supabase vers ObjectData
    const mappedObjects: ObjectData[] = (objects || []).map((obj: unknown) => {
      const object = obj as {
        id: string;
        nom: string;
        type: string;
        status: 'publie' | 'brouillon';
        description: string | null;
        long_description: string | null;
        utilisateur_id: string | null;
        created_at: string;
        updated_at: string;
        object_photos?: Array<{
          id: string;
          url: string;
          description: string[];
          display_order: number;
        }>;
      };
      const photos: ObjectPhoto[] = (object.object_photos || []).map((photo: unknown) => {
        const photoData = photo as { id: string; url: string; description: string[]; display_order: number };
        return {
          id: photoData.id,
          url: photoData.url,
          description: photoData.description || [],
          display_order: photoData.display_order || 0,
        };
      }).sort((a: ObjectPhoto, b: ObjectPhoto) => (a.display_order || 0) - (b.display_order || 0));

      return {
        id: object.id,
        nom: object.nom,
        type: object.type,
        status: object.status as ObjectData['status'],
        description: object.description || undefined,
        longDescription: object.long_description || undefined,
        utilisateur: object.utilisateur_id ? (userLoginMap.get(object.utilisateur_id) || '') : '',
        utilisateur_id: object.utilisateur_id || undefined,
        photos: photos.length > 0 ? photos : undefined,
        createdAt: object.created_at,
        updatedAt: object.updated_at,
      };
    });

    return NextResponse.json<ObjectData[]>(mappedObjects, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des objets:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel objet
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification et les droits admin
    const auth = await getAuthenticatedUser();
    if (!auth.user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Vous devez être connecté pour créer un objet' },
        { status: 401 }
      );
    }

    // Seuls les administrateurs peuvent créer des objets
    if (auth.user.status !== 'administrateur') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Seuls les administrateurs peuvent créer des objets' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(objectCreateSchema, body);
    if (!validation.success) {
      console.error('[POST /api/objects] Erreur de validation:', validation.error);
      return createValidationErrorResponse(validation.error);
    }
    
    const { nom, type, status, utilisateur, description, longDescription, photos } = validation.data;
    const supabase = await createServiceRoleClient();

    // Récupérer l'ID utilisateur depuis le login si fourni, sinon utiliser l'utilisateur connecté
    let utilisateurId: string | null = null;
    if (utilisateur) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', utilisateur)
        .single();
      utilisateurId = user?.id || null;
    } else {
      // Si aucun utilisateur n'est spécifié, utiliser l'utilisateur connecté
      utilisateurId = auth.user.id;
    }

    // Créer l'objet
    const objectId = Date.now().toString();
    const { data: newObject, error: objectError } = await supabase
      .from('objects')
      .insert({
        id: objectId,
        nom,
        type,
        status,
        utilisateur_id: utilisateurId,
        description: description || null,
        long_description: longDescription || null,
      })
      .select()
      .single();

    // Enregistrer dans l'historique manuellement (le trigger le fera aussi, mais on veut l'utilisateur actuel)
    if (!objectError && newObject && auth.user?.id) {
      const updatedBy = await determineUpdatedBy(supabase, auth.user.id);
      
      await logObjectHistory(supabase, {
        object_id: objectId,
        action: 'created',
        updated_at: new Date().toISOString(),
        new_values: newObject,
        changed_fields: ['nom', 'type', 'status', 'description', 'long_description', 'utilisateur_id'],
        updated_by: updatedBy,
      });
    }

    if (objectError || !newObject) {
      return createErrorResponse(
        objectError || new Error('Erreur lors de la création de l\'objet'),
        500,
        { route: '/api/objects', operation: 'POST' }
      );
    }

    // Créer les photos si présentes
    if (photos && photos.length > 0) {
      const photosToInsert = photos.map((photo, index) => ({
        object_id: objectId,
        url: photo.url,
        description: photo.description || [],
        display_order: photo.display_order || index,
      }));

      const { error: photosError } = await supabase
        .from('object_photos')
        .insert(photosToInsert);

      if (photosError) {
        console.error('Erreur création photos:', photosError);
        // Supprimer l'objet si les photos échouent
        await supabase.from('objects').delete().eq('id', objectId);
        return NextResponse.json<ErrorResponse>(
          { error: 'Erreur lors de la création des photos' },
          { status: 500 }
        );
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
      .eq('id', objectId)
      .single();

    // Mapper vers ObjectData
    const objectData: ObjectData = {
      id: completeObject!.id,
      nom: completeObject!.nom,
      type: completeObject!.type,
      status: completeObject!.status as ObjectData['status'],
      description: completeObject!.description || undefined,
      longDescription: completeObject!.long_description || undefined,
      utilisateur: utilisateur || '',
      utilisateur_id: completeObject!.utilisateur_id || undefined,
      photos: (completeObject!.object_photos || []).map((p: unknown) => {
        const photo = p as { id: string; url: string; description: string[]; display_order: number };
        return {
          id: photo.id,
          url: photo.url,
          description: photo.description || [],
          display_order: photo.display_order || 0,
        };
      }),
      createdAt: completeObject!.created_at,
      updatedAt: completeObject!.updated_at,
    };

    // Revalider le cache
    revalidatePath('/objects', 'page');
    revalidatePath(`/objects/${objectId}`, 'page');

    return NextResponse.json<SuccessResponse<ObjectData>>(
      { message: 'Objet créé avec succès', data: objectData },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Erreur lors de la création de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('OBJECT_CREATE_FAILED') },
      { status: 500 }
    );
  }
}
