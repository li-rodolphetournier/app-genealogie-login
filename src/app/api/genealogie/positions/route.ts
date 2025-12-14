import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireRedactor } from '@/lib/auth/middleware';
import { logger } from '@/lib/utils/logger';
import type { ErrorResponse } from '@/types/api/responses';

// GET - Récupérer toutes les positions des nœuds
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data: positions, error } = await supabase
      .from('genealogy_node_positions')
      .select('person_id, x, y');

    if (error) {
      logger.error('[API /genealogie/positions] Erreur lors de la récupération des positions:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la lecture des positions' },
        { status: 500 }
      );
    }

    // Convertir en objet pour faciliter l'utilisation côté client
    const positionsMap: Record<string, { x: number; y: number }> = {};
    (positions || []).forEach((pos: unknown) => {
      const position = pos as { person_id: string; x: number | string; y: number | string };
      positionsMap[position.person_id] = { 
        x: parseFloat(position.x.toString()), 
        y: parseFloat(position.y.toString()) 
      };
    });

    return NextResponse.json(positionsMap, { status: 200 });
  } catch (error: unknown) {
    logger.error('[API /genealogie/positions] Erreur inattendue lors de la lecture:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture des positions' },
      { status: 500 }
    );
  }
}

// PUT - Sauvegarder les positions (seulement rédacteurs et admins)
export async function PUT(request: Request) {
  try {
    // Vérifier les droits
    const user = await requireRedactor();

    const supabase = await createServiceRoleClient();
    const body = await request.json();
    const { positions } = body; // positions: { [personId]: { x, y } }

    if (!positions || typeof positions !== 'object') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    // Récupérer toutes les personnes existantes pour filtrer les positions invalides
    const { data: existingPersons, error: personsError } = await supabase
      .from('persons')
      .select('id');

    if (personsError) {
      logger.error('[API /genealogie/positions] Erreur lors de la récupération des personnes:', personsError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la vérification des personnes' },
        { status: 500 }
      );
    }

    const validPersonIds = new Set((existingPersons || []).map((p: unknown) => (p as { id: string }).id));

    // Convertir l'objet en array pour l'upsert, en filtrant les personnes qui n'existent plus
    const positionsArray = Object.entries(positions)
      .filter(([person_id]) => validPersonIds.has(person_id))
      .map(([person_id, pos]: [string, unknown]) => {
        const position = pos as { x: number | string; y: number | string };
        return {
          person_id,
          x: typeof position.x === 'number' ? position.x : parseFloat(String(position.x)),
          y: typeof position.y === 'number' ? position.y : parseFloat(String(position.y)),
          updated_by: user.id,
        };
      });

    if (positionsArray.length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Aucune position valide à sauvegarder' },
        { status: 400 }
      );
    }

    // Upsert toutes les positions en une seule requête
    const { error } = await supabase
      .from('genealogy_node_positions')
      .upsert(positionsArray, { onConflict: 'person_id' });

    if (error) {
      logger.error('[API /genealogie/positions] Erreur lors de la sauvegarde des positions:', error);
      return NextResponse.json<ErrorResponse>(
        { 
          error: `Erreur lors de la sauvegarde des positions: ${error.message || 'Erreur inconnue'}` 
        },
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
    logger.error('[API /genealogie/positions] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: `Erreur lors de la sauvegarde des positions: ${errorMessage}` },
      { status: 500 }
    );
  }
}

