/**
 * Utilitaires pour les headers de sécurité
 * Headers recommandés par OWASP pour la sécurité web
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Headers de sécurité recommandés
 */
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; '),
} as const;

/**
 * Ajoute les headers de sécurité à une réponse
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Crée une réponse avec les headers de sécurité
 */
export function createSecureResponse(
  body?: BodyInit | null,
  init?: ResponseInit
): NextResponse {
  const response = NextResponse.next(init);
  return addSecurityHeaders(response);
}

/**
 * Headers de sécurité pour les API routes
 */
export function getApiSecurityHeaders(): Record<string, string> {
  return {
    ...securityHeaders,
    // Ne jamais utiliser wildcard en production
    // Utiliser l'URL de l'application ou un domaine spécifique
    'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

