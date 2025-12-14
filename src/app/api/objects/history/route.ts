import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/middleware';
import { logger } from '@/lib/utils/logger';
import type { ErrorResponse } from '@/types/api/responses';

// GET - Récupérer l'historique des modifications d'objets (seulement administrateurs)
export async function GET(request: Request) {
  try {
    // Vérifier les droits administrateur
    try {
      await requireAdmin();
    } catch (authError: unknown) {
      logger.error('[API /objects/history] Erreur d\'authentification:', authError);
      const errorMessage = authError instanceof Error ? authError.message : 'Erreur d\'authentification';
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: errorMessage.includes('Non authentifié') ? 401 : 403 }
      );
    }

    const supabase = await createServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const objectId = searchParams.get('object_id');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Construire la requête avec filtres optionnels
    let query = supabase
      .from('objects_history')
      .select(`
        id,
        object_id,
        action,
        updated_at,
        updated_by,
        old_values,
        new_values,
        changed_fields,
        users:updated_by (
          id,
          login,
          email
        )
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtrer par objet si spécifié
    if (objectId) {
      query = query.eq('object_id', objectId);
    }

    const { data: history, error } = await query;

    if (error) {
      logger.error('[API /objects/history] Erreur lors de la récupération de l\'historique:', error);
      return NextResponse.json<ErrorResponse>(
        { error: `Erreur lors de la lecture de l'historique: ${error.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    // Formater les données pour le client
    const formattedHistory = (history || []).map((item: unknown) => {
      const historyItem = item as {
        id: string;
        object_id: string | null;
        action: string;
        updated_at: string;
        updated_by: string | null;
        old_values: Record<string, unknown> | null;
        new_values: Record<string, unknown> | null;
        changed_fields: string[] | null;
        users?: {
          id: string;
          login: string;
          email: string;
        } | null;
      };
      return {
        id: historyItem.id,
        objectId: historyItem.object_id,
        action: historyItem.action,
        updatedAt: historyItem.updated_at,
        updatedBy: historyItem.users ? {
          id: historyItem.users.id,
          login: historyItem.users.login,
          email: historyItem.users.email,
        } : null,
        oldValues: historyItem.old_values,
        newValues: historyItem.new_values,
        changedFields: historyItem.changed_fields || [],
      };
    });

    return NextResponse.json(formattedHistory, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    if (errorMessage.includes('Accès refusé') || errorMessage.includes('Non authentifié')) {
      return NextResponse.json<ErrorResponse>(
        { error: errorMessage },
        { status: errorMessage.includes('Non authentifié') ? 401 : 403 }
      );
    }
    logger.error('[API /objects/history] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur lors de la lecture de l\'historique' },
      { status: 500 }
    );
  }
}

