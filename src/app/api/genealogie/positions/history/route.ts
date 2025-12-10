import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';
import type { ErrorResponse } from '@/types/api/responses';

// GET - Récupérer l'historique des modifications (seulement administrateurs)
export async function GET(request: Request) {
  try {
    // Vérifier les droits administrateur
    try {
      await requireAdmin();
    } catch (authError: any) {
      console.error('Erreur d\'authentification:', authError);
      return NextResponse.json<ErrorResponse>(
        { error: authError.message || 'Erreur d\'authentification' },
        { status: authError.message?.includes('Non authentifié') ? 401 : 403 }
      );
    }

    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('person_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Construire la requête avec filtres optionnels
    let query = supabase
      .from('genealogy_node_positions_history')
      .select(`
        id,
        person_id,
        x,
        y,
        action,
        updated_at,
        updated_by,
        users:updated_by (
          id,
          login,
          email
        )
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrer par personne si spécifié
    if (personId) {
      query = query.eq('person_id', personId);
    }

    const { data: history, error } = await query;

    if (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      console.error('Code erreur:', error.code);
      console.error('Message erreur:', error.message);
      console.error('Détails erreur:', error.details);
      return NextResponse.json<ErrorResponse>(
        { error: `Erreur lors de la lecture de l'historique: ${error.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    // Formater les données pour le client
    const formattedHistory = (history || []).map((item: any) => ({
      id: item.id,
      personId: item.person_id,
      x: parseFloat(item.x.toString()),
      y: parseFloat(item.y.toString()),
      action: item.action,
      updatedAt: item.updated_at,
      updatedBy: item.users ? {
        id: item.users.id,
        login: item.users.login,
        email: item.users.email,
      } : null,
    }));

    return NextResponse.json(formattedHistory, { status: 200 });
  } catch (error: any) {
    if (error.message.includes('Accès refusé') || error.message.includes('Non authentifié')) {
      return NextResponse.json<ErrorResponse>(
        { error: error.message },
        { status: error.message.includes('Non authentifié') ? 401 : 403 }
      );
    }
    console.error('Erreur lors de la lecture de l\'historique:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture de l\'historique' },
      { status: 500 }
    );
  }
}

