import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ObjectPhoto } from '@/types/objects';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// POST - Ajouter des photos à un objet
export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body: { photos: ObjectPhoto[] } = await request.json();
    const { photos } = body;

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Photos manquantes ou format invalide' },
        { status: 400 }
      );
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
        { error: 'Objet non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le nombre actuel de photos pour déterminer display_order
    const { data: existingPhotos } = await supabase
      .from('object_photos')
      .select('display_order')
      .eq('object_id', id)
      .order('display_order', { ascending: false })
      .limit(1);

    const maxDisplayOrder = existingPhotos && existingPhotos.length > 0 
      ? (existingPhotos[0].display_order || 0) 
      : -1;

    // Insérer les nouvelles photos
    const photosToInsert = photos.map((photo, index) => ({
      object_id: id,
      url: photo.url,
      description: photo.description || [],
      display_order: photo.display_order ?? (maxDisplayOrder + 1 + index),
    }));

    const { data: insertedPhotos, error: insertError } = await supabase
      .from('object_photos')
      .insert(photosToInsert)
      .select();

    if (insertError || !insertedPhotos) {
      console.error('Erreur insertion photos:', insertError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de l\'ajout des photos' },
        { status: 500 }
      );
    }

    // Revalider le cache
    revalidatePath(`/objects/${id}`, 'page');

    const mappedPhotos: ObjectPhoto[] = insertedPhotos.map((p: unknown) => {
      const photo = p as { id: string; url: string; description: string[]; display_order: number };
      return {
        id: photo.id,
        url: photo.url,
        description: photo.description || [],
        display_order: photo.display_order || 0,
      };
    });

    return NextResponse.json<SuccessResponse<{ photos: ObjectPhoto[] }>>(
      { message: 'Photos ajoutées avec succès', data: { photos: mappedPhotos } },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Erreur lors de l\'ajout des photos:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout des photos' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une photo d'un objet
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('photoId');

    if (!photoId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ID de photo manquant' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Vérifier que la photo existe et appartient à l'objet
    const { data: photo } = await supabase
      .from('object_photos')
      .select('id, object_id')
      .eq('id', photoId)
      .eq('object_id', id)
      .single();

    if (!photo) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Photo non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la photo
    const { error: deleteError } = await supabase
      .from('object_photos')
      .delete()
      .eq('id', photoId);

    if (deleteError) {
      console.error('Erreur suppression photo:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la suppression de la photo' },
        { status: 500 }
      );
    }

    // Revalider le cache
    revalidatePath(`/objects/${id}`, 'page');

    return NextResponse.json<SuccessResponse>(
      { message: 'Photo supprimée avec succès' },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Erreur lors de la suppression de la photo:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Erreur lors de la suppression de la photo' },
      { status: 500 }
    );
  }
}
