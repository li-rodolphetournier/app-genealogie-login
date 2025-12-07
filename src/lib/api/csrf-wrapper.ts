/**
 * Wrapper pour protéger les routes API avec CSRF
 */

import { NextResponse } from 'next/server';
import type { Request } from 'next/server';
import { verifyCsrfToken } from '@/lib/security/csrf';

/**
 * Wrapper pour protéger une route API avec CSRF
 * 
 * @param handler - La fonction handler de la route
 * @param requireCsrf - Si true, exige CSRF (défaut: true pour POST/PUT/DELETE)
 */
export function withCsrfProtection<T = any>(
  handler: (request: Request) => Promise<NextResponse<T>> | NextResponse<T>,
  requireCsrf: boolean = true
) {
  return async (request: Request): Promise<NextResponse<T>> => {
    // Les méthodes GET et OPTIONS n'ont pas besoin de CSRF
    if (!requireCsrf || request.method === 'GET' || request.method === 'OPTIONS') {
      return handler(request);
    }

    // Vérifier le token CSRF pour les autres méthodes
    const isValidCsrf = await verifyCsrfToken(request);
    
    if (!isValidCsrf) {
      return NextResponse.json<T>(
        { error: 'Token CSRF invalide ou manquant' } as T,
        { status: 403 }
      );
    }

    return handler(request);
  };
}

