import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ErrorResponse } from '@/types/api/responses';
import { z } from 'zod';

/**
 * Schéma de validation pour une catégorie
 */
const categorySchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  description: z.string().optional(),
});

const categoryUpdateSchema = categorySchema.partial().extend({
  name: z.string().min(1).max(100).optional(),
});

/**
 * GET /api/categories
 * Récupère toutes les catégories
 */
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();
    
    const { data: categories, error } = await supabase
      .from('object_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[GET /api/categories] Erreur Supabase:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la récupération des catégories' },
        { status: 500 }
      );
    }

    // Si la table n'existe pas encore ou est vide, fallback sur les types d'objets existants
    if (!categories || categories.length === 0) {
      const { data: objects } = await supabase
        .from('objects')
        .select('type')
        .not('type', 'is', null);
      
      const uniqueTypes = [...new Set((objects || []).map((obj: any) => obj.type).filter(Boolean))];
      
      return NextResponse.json({
        categories: uniqueTypes.sort().map((type: string) => ({
          id: null,
          name: type,
          description: null,
          createdAt: null,
          updatedAt: null,
        })),
        legacy: true, // Indique que c'est un fallback
      }, { status: 200 });
    }

    return NextResponse.json({
      categories: categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || null,
        createdAt: cat.created_at,
        updatedAt: cat.updated_at,
      })),
    }, { status: 200 });
  } catch (error) {
    console.error('[GET /api/categories] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur lors de la récupération des catégories' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Crée une nouvelle catégorie
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = categorySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Données invalides', details: validation.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();
    
    // Vérifier si la table existe, sinon utiliser le fallback
    const { data: tableCheck } = await supabase
      .from('object_categories')
      .select('id')
      .limit(1);

    // Si la table n'existe pas, on ne peut pas créer de catégorie
    // L'utilisateur devra d'abord créer la table via la migration SQL
    if (tableCheck === null) {
      return NextResponse.json<ErrorResponse>(
        { error: 'La table des catégories n\'existe pas encore. Veuillez exécuter la migration SQL.' },
        { status: 503 }
      );
    }
    
    const { data: category, error } = await supabase
      .from('object_categories')
      .insert({
        name: validation.data.name.trim(),
        description: validation.data.description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505' || error.message.includes('unique')) { // Violation de contrainte unique
        return NextResponse.json<ErrorResponse>(
          { error: 'Cette catégorie existe déjà' },
          { status: 409 }
        );
      }
      console.error('[POST /api/categories] Erreur Supabase:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la création de la catégorie' },
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
    }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/categories] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur lors de la création de la catégorie' },
      { status: 500 }
    );
  }
}
