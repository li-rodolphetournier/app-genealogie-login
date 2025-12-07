/**
 * Gestionnaire d'erreurs centralisé pour les API routes
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError, InternalServerError } from './app-error';
import { getErrorMessage } from './messages';
import type { ErrorResponse } from '@/types/api/responses';
import { formatZodError, type ValidationError as ZodValidationError } from '@/lib/validations/utils';

/**
 * Formate une réponse d'erreur pour l'API
 */
export function createErrorResponse(
  error: AppError | Error | z.ZodError | unknown
): NextResponse<ErrorResponse> {
  // Erreur de validation Zod
  if (error instanceof z.ZodError) {
    const formattedErrors = formatZodError(error);
    return NextResponse.json<ErrorResponse>(
      {
        error: getErrorMessage('VALIDATION_ERROR'),
        code: 'VALIDATION_ERROR',
        details: formattedErrors,
      },
      { status: 400 }
    );
  }

  // Erreur personnalisée AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.message,
      code: error.code,
    };

    // Ajouter les détails si disponibles (pour les erreurs de validation)
    if (error.details) {
      (response as any).details = error.details;
    }

    return NextResponse.json<ErrorResponse>(response, {
      status: error.statusCode,
    });
  }

  // Erreur standard Error
  if (error instanceof Error) {
    // Ne pas exposer les détails des erreurs internes en production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return NextResponse.json<ErrorResponse>(
      {
        error: isDevelopment ? error.message : 'Erreur interne du serveur',
        code: 'INTERNAL_SERVER_ERROR',
        ...(isDevelopment && { message: error.stack }),
      },
      { status: 500 }
    );
  }

  // Erreur inconnue
  console.error('Erreur inattendue:', error);
  return NextResponse.json<ErrorResponse>(
    {
      error: getErrorMessage('SERVER_ERROR'),
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  );
}

/**
 * Wrapper pour gérer les erreurs dans les routes API
 * Utilisation : return handleApiRoute(async () => { ... })
 */
export function handleApiRoute<T>(
  handler: () => Promise<T>
): Promise<NextResponse<T | ErrorResponse>> {
  return handler()
    .then((data) => {
      // Si c'est déjà une NextResponse, la retourner telle quelle
      if (data instanceof NextResponse) {
        return data;
      }
      // Sinon, créer une réponse de succès
      return NextResponse.json(data);
    })
    .catch((error) => {
      return createErrorResponse(error);
    });
}

/**
 * Enveloppe une fonction route handler avec gestion d'erreurs
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error);
    }
  }) as T;
}

/**
 * Log une erreur pour le monitoring
 */
export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}]` : '';
  
  if (error instanceof AppError) {
    console.error(`${timestamp} ${contextStr} ${error.name}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
  } else if (error instanceof Error) {
    console.error(`${timestamp} ${contextStr} Error:`, {
      message: error.message,
      stack: error.stack,
    });
  } else {
    console.error(`${timestamp} ${contextStr} Unknown error:`, error);
  }
}

