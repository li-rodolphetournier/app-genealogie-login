/**
 * Utilitaires pour la validation Zod
 */

import { z } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Type pour les erreurs de validation
 */
export type ValidationError = {
  field: string;
  message: string;
};

/**
 * Formate les erreurs Zod pour la réponse API
 */
export function formatZodError(error: z.ZodError): ValidationError[] {
  return error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Crée une réponse d'erreur de validation
 */
export function createValidationErrorResponse(error: z.ZodError): NextResponse {
  const formattedErrors = formatZodError(error);
  return NextResponse.json(
    {
      error: 'Erreur de validation',
      details: formattedErrors,
    },
    { status: 400 }
  );
}

/**
 * Valide les données avec un schéma Zod et retourne les données validées ou une erreur
 */
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

