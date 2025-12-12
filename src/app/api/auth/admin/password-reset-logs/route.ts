/**
 * Route API pour consulter les logs de réinitialisation de mot de passe
 * Accessible uniquement aux administrateurs
 */

import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { getPasswordResetLogs } from '@/lib/audit/password-reset-logger';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

export async function GET(request: Request) {
  try {
    // Vérifier que l'utilisateur est admin
    const auth = await getAuthenticatedUser();
    if (!auth.user || auth.user.status !== 'administrateur') {
      return NextResponse.json<ErrorResponse>(
        { error: 'Accès non autorisé. Administrateur requis.' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const userEmail = searchParams.get('userEmail') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Récupérer les logs
    const logs = await getPasswordResetLogs(userId, userEmail, limit);

    return NextResponse.json<SuccessResponse>(
      { 
        message: 'Logs récupérés avec succès',
        data: logs
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur récupération logs:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

