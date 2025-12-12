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
import { logAuth } from '@/lib/features/auth-debug';
import { isMockModeEnabled, createMockUser, isMockUserId } from '@/lib/features/mock-auth';

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
 * Gère également le mode mock en développement
 */
async function checkAuth(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Vérifier le mode mock (uniquement en développement)
    const mockId = request.nextUrl.searchParams.get('mock');
    if (mockId && isMockModeEnabled()) {
      // Créer un cookie pour le mock
      const mockUser = createMockUser(mockId);
      response.cookies.set('mock-user-id', mockId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 heures
      });
      
      // Retourner un utilisateur mock (on simule un user Supabase)
      const mockSupabaseUser = {
        id: mockUser.id,
        email: mockUser.email,
        created_at: mockUser.createdAt || new Date().toISOString(),
        updated_at: mockUser.updatedAt || new Date().toISOString(),
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] Mode mock activé avec ID: ${mockId}`);
      }
      
      return { 
        user: mockSupabaseUser as any, 
        error: null, 
        response,
        isMock: true,
        mockUser 
      };
    }

    // Vérifier si un cookie mock existe (pour les requêtes suivantes)
    const existingMockId = request.cookies.get('mock-user-id')?.value;
    if (existingMockId && isMockModeEnabled()) {
      const mockUser = createMockUser(existingMockId);
      const mockSupabaseUser = {
        id: mockUser.id,
        email: mockUser.email,
        created_at: mockUser.createdAt || new Date().toISOString(),
        updated_at: mockUser.updatedAt || new Date().toISOString(),
      };
      
      return { 
        user: mockSupabaseUser as any, 
        error: null, 
        response,
        isMock: true,
        mockUser 
      };
    }

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
    const cookies = request.cookies.getAll();
    const hasAuthCookie = cookies.some(c => c.name.includes('auth') || c.name.includes('supabase'));
    
    logAuth.middleware('Vérification auth', { 
      pathname: request.nextUrl.pathname,
      hasAuthCookie,
      cookieCount: cookies.length
    });
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[MIDDLEWARE] Path: ${request.nextUrl.pathname}, Has auth cookie: ${hasAuthCookie}`);
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    
    logAuth.middleware('Résultat vérification auth', { 
      pathname: request.nextUrl.pathname,
      hasUser: !!user,
      userEmail: user?.email,
      hasError: !!error,
      errorMessage: error instanceof Error ? error.message : error ? String(error) : undefined
    });

    return { user, error, response, isMock: false };
  } catch (error) {
    return { user: null, error, response: NextResponse.next(), isMock: false };
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
    // Vérifier le mode mock AVANT checkAuth pour éviter les redirections
    const mockId = request.nextUrl.searchParams.get('mock');
    if (mockId && isMockModeEnabled()) {
      const mockUser = createMockUser(mockId);
      
      // Utiliser la réponse existante avec les headers de sécurité
      response.cookies.set('mock-user-id', mockId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 heures
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[MIDDLEWARE] Mode mock activé avec ID: ${mockId} pour ${pathname}`);
      }
      
      // Le mock a toujours les droits admin, donc on peut retourner directement la réponse
      // pour toutes les routes protégées (y compris les routes admin)
      return response;
    }
    
    const authResult = await checkAuth(request);
    const { user, error, response: authResponse, isMock, mockUser } = authResult as any;

    if (error || !user) {
      logAuth.middleware('Utilisateur non authentifié', { 
        pathname,
        error: error ? (typeof error === 'object' && 'message' in error ? String(error.message) : String(error)) : undefined,
        hasUser: !!user
      });
      
      // Rediriger vers la page de login pour les pages
      if (pathname.startsWith('/')) {
        logAuth.redirect(pathname, '/', 'Utilisateur non authentifié (middleware)');
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
      // Si c'est un mock, vérifier directement le statut du mockUser
      if (isMock && mockUser) {
        if (mockUser.status !== 'administrateur') {
          if (pathname.startsWith('/')) {
            return NextResponse.redirect(new URL('/accueil', request.url));
          }
          return NextResponse.json(
            { error: 'Accès refusé : droits administrateur requis' },
            { status: 403 }
          );
        }
        // Le mock a toujours les droits admin, continuer
      } else {
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
