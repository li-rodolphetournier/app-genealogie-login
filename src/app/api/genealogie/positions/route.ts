import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireRedactor } from '@/lib/auth/middleware';
import type { ErrorResponse } from '@/types/api/responses';

// GET - Récupérer toutes les positions des nœuds
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data: positions, error } = await supabase
      .from('genealogy_node_positions')
      .select('person_id, x, y');

    if (error) {
      console.error('Erreur lors de la récupération des positions:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la lecture des positions' },
        { status: 500 }
      );
    }

    // Convertir en objet pour faciliter l'utilisation côté client
    const positionsMap: Record<string, { x: number; y: number }> = {};
    (positions || []).forEach((pos: any) => {
      positionsMap[pos.person_id] = { 
        x: parseFloat(pos.x.toString()), 
        y: parseFloat(pos.y.toString()) 
      };
    });

    return NextResponse.json(positionsMap, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la lecture des positions:', error);
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

    // Convertir l'objet en array pour l'upsert
    const positionsArray = Object.entries(positions).map(([person_id, pos]: [string, any]) => ({
      person_id,
      x: pos.x,
      y: pos.y,
      updated_by: user.id,
    }));

    // Upsert toutes les positions en une seule requête
    const { error } = await supabase
      .from('genealogy_node_positions')
      .upsert(positionsArray, { onConflict: 'person_id' });

    if (error) {
      console.error('Erreur lors de la sauvegarde des positions:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la sauvegarde des positions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Accès refusé') || error.message.includes('Non authentifié')) {
      return NextResponse.json<ErrorResponse>(
        { error: error.message },
        { status: error.message.includes('Non authentifié') ? 401 : 403 }
      );
    }
    console.error('Erreur lors de la sauvegarde des positions:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la sauvegarde des positions' },
      { status: 500 }
    );
  }
}

