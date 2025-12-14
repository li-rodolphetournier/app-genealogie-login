import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';
import type { ErrorResponse } from '@/types/api/responses';

// GET - Récupérer la visibilité de toutes les cartes
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data: visibility, error } = await supabase
      .from('genealogy_card_visibility')
      .select('card_key, is_visible')
      .order('card_key');

    if (error) {
      console.error('Erreur lors de la récupération de la visibilité:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la lecture de la visibilité' },
        { status: 500 }
      );
    }

    // Convertir en objet pour faciliter l'utilisation côté client
    const visibilityMap: Record<string, boolean> = {};
    (visibility || []).forEach((item: unknown) => {
      const visibilityItem = item as { card_key: string; is_visible: boolean };
      visibilityMap[visibilityItem.card_key] = visibilityItem.is_visible;
    });

    return NextResponse.json(visibilityMap, { status: 200 });
  } catch (error: unknown) {
    console.error('Erreur lors de la lecture de la visibilité:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture de la visibilité' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour la visibilité (seulement administrateurs)
export async function PUT(request: Request) {
  try {
    // Vérifier les droits administrateur
    const user = await requireAdmin();

    const supabase = await createServiceRoleClient();
    const body = await request.json();
    const { cardKey, isVisible } = body;

    if (!cardKey || typeof isVisible !== 'boolean') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    // Upsert la visibilité
    // Note: createServiceRoleClient() contourne RLS, donc les politiques RLS ne s'appliquent pas
    const { data, error } = await supabase
      .from('genealogy_card_visibility')
      .upsert({
        card_key: cardKey,
        is_visible: isVisible,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'card_key' });

    if (error) {
      console.error('Erreur lors de la mise à jour de la visibilité:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { 
          error: `Erreur lors de la mise à jour de la visibilité: ${error.message || error.details || 'Erreur inconnue'}`
        } as ErrorResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    if (errorMessage.includes('Accès refusé') || errorMessage.includes('Non authentifié')) {
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: errorMessage.includes('Non authentifié') ? 401 : 403 }
      );
    }
    console.error('Erreur lors de la mise à jour de la visibilité:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la mise à jour de la visibilité' },
      { status: 500 }
    );
  }
}

