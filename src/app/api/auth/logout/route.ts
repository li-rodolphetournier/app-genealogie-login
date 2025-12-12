/**
 * Route API pour la déconnexion
 * Gère la déconnexion côté serveur pour s'assurer que les cookies sont bien supprimés
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/utils/logger';
import type { SuccessResponse, ErrorResponse } from '@/types/api/responses';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Déconnexion côté serveur
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('[API /auth/logout] Erreur lors de la déconnexion:', error);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la déconnexion' },
        { status: 500 }
      );
    }

    // Retourner une réponse de succès
    // Les cookies seront supprimés automatiquement par Supabase
    return NextResponse.json<SuccessResponse>(
      { message: 'Déconnexion réussie' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('[API /auth/logout] Erreur inattendue:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur lors de la déconnexion' },
      { status: 500 }
    );
  }
}

