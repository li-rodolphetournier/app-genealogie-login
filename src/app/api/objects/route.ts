import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { objectCreateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { ObjectData, ObjectPhoto } from '@/types/objects';
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
    const userIds = [...new Set((objects || []).map((obj: any) => obj.utilisateur_id).filter(Boolean))];
    
    // Récupérer les logins des utilisateurs en une seule requête
    const { data: users } = await supabase
      .from('users')
      .select('id, login')
      .in('id', userIds);
    
    const userLoginMap = new Map((users || []).map((u: any) => [u.id, u.login]));

    // Mapper les données Supabase vers ObjectData
    const mappedObjects: ObjectData[] = (objects || []).map((obj: any) => {
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
        utilisateur: obj.utilisateur_id ? (userLoginMap.get(obj.utilisateur_id) || '') : '',
        utilisateur_id: obj.utilisateur_id || undefined,
        photos: photos.length > 0 ? photos : undefined,
        createdAt: obj.created_at,
        updatedAt: obj.updated_at,
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
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(objectCreateSchema, body);
    if (!validation.success) {
      console.error('[POST /api/objects] Erreur de validation:', validation.error);
      return createValidationErrorResponse(validation.error);
    }
    
    const { nom, type, status, utilisateur, description, longDescription, photos } = validation.data;
    const supabase = await createServiceRoleClient();

    // Récupérer l'ID utilisateur depuis le login si nécessaire
    let utilisateurId: string | null = null;
    if (utilisateur) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('login', utilisateur)
        .single();
      utilisateurId = user?.id || null;
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

    if (objectError || !newObject) {
      console.error('Erreur création objet:', objectError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la création de l\'objet' },
        { status: 500 }
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
      photos: (completeObject!.object_photos || []).map((p: any) => ({
        id: p.id,
        url: p.url,
        description: p.description || [],
        display_order: p.display_order || 0,
      })),
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
  } catch (error: any) {
    console.error('Erreur lors de la création de l\'objet:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('OBJECT_CREATE_FAILED') },
      { status: 500 }
    );
  }
}
