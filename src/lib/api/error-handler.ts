/**
 * Gestionnaire d'erreurs centralisé pour les routes API
 * Suit les meilleures pratiques pour la gestion d'erreurs
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/lib/errors/messages';
import type { ErrorResponse } from '@/types/api/responses';

type ErrorContext = {
  route: string;
  operation?: string;
  userId?: string;
  [key: string]: unknown;
};

/**
 * Crée une réponse d'erreur standardisée
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500,
  context?: ErrorContext
): NextResponse<ErrorResponse> {
  // Logger l'erreur avec le contexte
  if (context) {
    logger.error(`[API ${context.route}]${context.operation ? ` ${context.operation}` : ''} Erreur:`, error);
  } else {
    logger.error('Erreur API:', error);
  }

  // Extraire le message d'erreur
  let errorMessage: string;
  let errorDetails: Record<string, unknown> | undefined;

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = error.cause ? { cause: String(error.cause) } : undefined;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    errorMessage = String(error.message);
    if ('details' in error) {
      errorDetails = typeof error.details === 'string'
        ? { message: error.details }
        : (error.details as Record<string, unknown>);
    }
  } else {
    errorMessage = getErrorMessage('SERVER_ERROR');
  }

  // Gérer les erreurs d'authentification
  if (errorMessage.includes('Accès refusé') || errorMessage.includes('Non authentifié')) {
    return NextResponse.json<ErrorResponse>(
      { error: errorMessage },
      { status: errorMessage.includes('Non authentifié') ? 401 : 403 }
    );
  }

  return NextResponse.json<ErrorResponse>(
    {
      error: errorMessage,
      details: errorDetails,
    },
    { status }
  );
}

/**
 * Wrapper pour les routes API avec gestion d'erreurs automatique
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context: ErrorContext
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error: unknown) {
      // Gérer les erreurs d'authentification
      if (error instanceof Error) {
        if (error.message.includes('Accès refusé') || error.message.includes('Non authentifié')) {
          return createErrorResponse(error, error.message.includes('Non authentifié') ? 401 : 403, context);
        }
      }

      return createErrorResponse(error, 500, context);
    }
  };
}

/**
 * Valide les paramètres de requête
 */
export function validateRequestParams(
  params: Record<string, unknown>,
  required: string[]
): { valid: true } | { valid: false; error: NextResponse<ErrorResponse> } {
  const missing = required.filter(key => !params[key]);

  if (missing.length > 0) {
    return {
      valid: false,
      error: NextResponse.json<ErrorResponse>(
        { error: `Paramètres manquants: ${missing.join(', ')}` },
        { status: 400 }
      ),
    };
  }

  return { valid: true };
}

