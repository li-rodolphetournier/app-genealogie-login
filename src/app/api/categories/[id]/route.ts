import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ErrorResponse } from '@/types/api/responses';
import { z } from 'zod';

/**
 * Schéma de validation pour la mise à jour d'une catégorie
 */
const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères').optional(),
  description: z.string().optional(),
});

/**
 * GET /api/categories/[id]
 * Récupère une catégorie par son ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServiceRoleClient();
    
    const { data: category, error } = await supabase
      .from('object_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/categories/[id]] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]
 * Met à jour une catégorie
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = categoryUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();
    
    const updateData: any = {};
    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name.trim();
    }
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description?.trim() || null;
    }

    const { data: category, error } = await supabase
      .from('object_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Violation de contrainte unique
        return NextResponse.json<ErrorResponse>(
          { error: 'Cette catégorie existe déjà' },
          { status: 409 }
        );
      }
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json<ErrorResponse>(
          { error: 'Catégorie non trouvée' },
          { status: 404 }
        );
      }
      console.error('[PUT /api/categories/[id]] Erreur Supabase:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la mise à jour de la catégorie' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/categories/[id]] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Supprime une catégorie
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServiceRoleClient();
    
    // Récupérer d'abord le nom de la catégorie
    const { data: category } = await supabase
      .from('object_categories')
      .select('name')
      .eq('id', id)
      .single();

    if (!category) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si la catégorie est utilisée par des objets
    const { data: objectsUsingCategory, error: checkError } = await supabase
      .from('objects')
      .select('id, nom')
      .eq('type', category.name);

    if (checkError) {
      console.error('[DELETE /api/categories/[id]] Erreur vérification objets:', checkError);
    }

    if (objectsUsingCategory && objectsUsingCategory.length > 0) {
      return NextResponse.json<ErrorResponse>(
        { error: `Cette catégorie est utilisée par ${objectsUsingCategory.length} objet(s) et ne peut pas être supprimée` },
        { status: 409 }
      );
    }
    
    const { error } = await supabase
      .from('object_categories')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Catégorie non trouvée' },
          { status: 404 }
        );
      }
      console.error('[DELETE /api/categories/[id]] Erreur Supabase:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la suppression de la catégorie' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/categories/[id]] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

