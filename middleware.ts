/**
 * Middleware Next.js avec sécurité renforcée
 * - Protection des routes avec Supabase Auth
 * - Headers de sécurité
 * - Rate limiting
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { addSecurityHeaders } from '@/lib/security/headers';
import { checkRateLimit, getRequestIdentifier, rateLimitConfigs } from '@/lib/security/rate-limit';

/**
 * Routes publiques (accessibles sans authentification)
 */
const PUBLIC_ROUTES = [
  '/',
  '/api/auth/login',
] as const;

/**
 * Routes nécessitant une authentification
 */
const PROTECTED_ROUTES = [
  '/accueil',
  '/objects',
  '/users',
  '/messages',
  '/genealogie',
] as const;

/**
 * Routes nécessitant les droits administrateur
 */
const ADMIN_ROUTES = [
  '/users',
  '/messages',
] as const;

/**
 * Routes API nécessitant une authentification
 */
const PROTECTED_API_ROUTES = [
  '/api/users',
  '/api/objects',
  '/api/messages',
  '/api/genealogie',
] as const;

/**
 * Routes API nécessitant les droits administrateur
 */
const ADMIN_API_ROUTES = [
  '/api/users',
  '/api/messages',
] as const;

/**
 * Vérifie si une route correspond à un pattern
 */
function matchesRoute(pathname: string, routes: readonly string[]): boolean {
  return routes.some((route) => pathname.startsWith(route));
}

/**
 * Vérifie l'authentification avec Supabase
 */
async function checkAuth(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    // Log de débogage pour le middleware
    if (process.env.NODE_ENV === 'development') {
      const cookies = request.cookies.getAll();
      const hasAuthCookie = cookies.some(c => c.name.includes('auth') || c.name.includes('supabase'));
      console.log(`[MIDDLEWARE] Path: ${request.nextUrl.pathname}, Has auth cookie: ${hasAuthCookie}`);
    }

    const { data: { user }, error } = await supabase.auth.getUser();

    return { user, error, response };
  } catch (error) {
    return { user: null, error, response: NextResponse.next() };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ajouter les headers de sécurité à toutes les réponses
  let response = NextResponse.next();
  response = addSecurityHeaders(response);

  // Rate limiting pour les routes API
  if (pathname.startsWith('/api/')) {
    const identifier = getRequestIdentifier(request);
    
    // Rate limiting spécial pour le login
    if (pathname === '/api/auth/login') {
      const rateLimit = await checkRateLimit(identifier, rateLimitConfigs.login);
      
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Trop de tentatives. Veuillez réessayer plus tard.' },
          { status: 429, headers: { 'Retry-After': '900' } }
        );
      }

      // Ajouter les headers de rate limit
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetAt).toISOString());
    } else {
      // Rate limiting général pour les API
      const rateLimit = await checkRateLimit(identifier, rateLimitConfigs.api);
      
      if (!rateLimit.allowed) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
          { status: 429 }
        );
      }
    }
  }

  // Routes publiques : autoriser l'accès
  if (matchesRoute(pathname, PUBLIC_ROUTES)) {
    return response;
  }

  // Vérifier l'authentification pour les routes protégées
  if (matchesRoute(pathname, PROTECTED_ROUTES) || matchesRoute(pathname, PROTECTED_API_ROUTES)) {
    const { user, error, response: authResponse } = await checkAuth(request);

    if (error || !user) {
      // Rediriger vers la page de login pour les pages
      if (pathname.startsWith('/')) {
        // Log de débogage
        if (process.env.NODE_ENV === 'development') {
          console.log(`[MIDDLEWARE] Redirection vers / depuis ${pathname} - Utilisateur non authentifié`);
        }
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/';
        redirectUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Retourner 401 pour les API
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier les droits administrateur si nécessaire
    if (matchesRoute(pathname, ADMIN_ROUTES) || matchesRoute(pathname, ADMIN_API_ROUTES)) {
      // Récupérer le profil utilisateur pour vérifier le statut
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(_cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
              // Ignorer les modifications de cookies dans le middleware
            },
          },
        }
      );

      const { data: profile } = await supabase
        .from('users')
        .select('status')
        .eq('id', user.id)
        .single();

      if (profile?.status !== 'administrateur') {
        // Rediriger ou retourner 403
        if (pathname.startsWith('/')) {
          return NextResponse.redirect(new URL('/accueil', request.url));
        }

        return NextResponse.json(
          { error: 'Accès refusé : droits administrateur requis' },
          { status: 403 }
        );
      }
    }

    return authResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Matcher toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico (favicon)
     * - fichiers publics (public/)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
