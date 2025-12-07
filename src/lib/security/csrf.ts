/**
 * Protection CSRF simple
 * Pour la production, utiliser un système plus robuste
 */

import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';

/**
 * Génère un token CSRF
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Génère et stocke un token CSRF dans les cookies
 */
export async function setCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  const cookieStore = await cookies();
  
  cookieStore.set(CSRF_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 heures
  });

  return token;
}

/**
 * Vérifie le token CSRF d'une requête
 */
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_COOKIE)?.value;
  const headerToken = request.headers.get(CSRF_TOKEN_HEADER);

  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

/**
 * Récupère le token CSRF depuis les cookies
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_TOKEN_COOKIE)?.value || null;
}

