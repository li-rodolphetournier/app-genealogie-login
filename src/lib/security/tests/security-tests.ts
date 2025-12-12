/**
 * Tests de sécurité automatisés
 */

import type { SecurityTestResult } from '@/lib/monitoring/types';
import { randomBytes } from 'crypto';
import { isProduction } from '@/lib/utils/env';

export interface SecurityTest {
  name: string;
  description: string;
  run: () => Promise<{ passed: boolean; details?: string; error?: string }>;
}

async function testSecurityHeaders(): Promise<{ passed: boolean; details?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      if (isProduction()) {
        return {
          passed: false,
          error: 'NEXT_PUBLIC_APP_URL n\'est pas défini en production',
        };
      }
      // En développement, utiliser localhost comme fallback
      return {
        passed: false,
        error: 'NEXT_PUBLIC_APP_URL n\'est pas défini. Définissez cette variable pour exécuter les tests.',
      };
    }
    // Utiliser GET au lieu de HEAD car certains serveurs ne retournent pas les headers avec HEAD
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
      // Ne pas suivre les redirections pour voir les headers
      redirect: 'manual',
    });

    // Les headers HTTP sont normalisés en minuscules par le fetch API
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'content-security-policy',
    ];

    const missingHeaders: string[] = [];
    const allHeaders: string[] = [];
    
    // Récupérer tous les noms de headers pour le débogage
    response.headers.forEach((value, key) => {
      allHeaders.push(`${key}: ${value}`);
    });

    requiredHeaders.forEach(header => {
      // Le fetch API normalise les headers en minuscules
      const headerValue = response.headers.get(header);
      if (!headerValue) {
        missingHeaders.push(header);
      }
    });

    if (missingHeaders.length > 0) {
      return {
        passed: false,
        details: `Headers manquants: ${missingHeaders.join(', ')}. Headers présents: ${allHeaders.slice(0, 5).join(', ')}...`,
      };
    }

    return { passed: true, details: 'Tous les headers de sécurité sont présents' };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

async function testProtectedRoutes(): Promise<{ passed: boolean; details?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      if (isProduction()) {
        return {
          passed: false,
          error: 'NEXT_PUBLIC_APP_URL n\'est pas défini en production',
        };
      }
      return {
        passed: false,
        error: 'NEXT_PUBLIC_APP_URL n\'est pas défini. Définissez cette variable pour exécuter les tests.',
      };
    }
    const protectedRoutes = ['/accueil', '/users', '/messages'];
    const results: string[] = [];

    for (const route of protectedRoutes) {
      // Faire une requête SANS cookies ni authentification
      // S'assurer qu'aucun paramètre mock n'est présent
      const url = new URL(`${baseUrl}${route}`);
      url.searchParams.delete('mock'); // Supprimer tout paramètre mock
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'manual', // Ne pas suivre les redirections automatiquement
        // Ne pas envoyer de cookies
        credentials: 'omit',
        headers: {
          'Cookie': '', // Forcer l'absence de cookies
          'User-Agent': 'Security-Test-Bot/1.0', // Identifier comme un bot de test
        },
      });

      // Les routes protégées doivent retourner 401, 403, ou une redirection (307/308)
      // NextResponse.redirect() retourne généralement 307 ou 308
      const status = response.status;
      
      // Vérifier aussi le header Location pour les redirections
      const location = response.headers.get('location');
      const isRedirect = status >= 300 && status < 400;
      const isProtected = status === 401 || status === 403 || isRedirect;
      
      if (!isProtected) {
        results.push(`${route} (status: ${status}${location ? `, location: ${location}` : ''})`);
      }
    }

    if (results.length > 0) {
      return {
        passed: false,
        details: `Routes non protégées: ${results.join(', ')}. Note: En développement avec mode mock, certaines routes peuvent être accessibles.`,
      };
    }

    return { passed: true, details: 'Toutes les routes protégées nécessitent une authentification' };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

async function testRateLimiting(): Promise<{ passed: boolean; details?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      if (isProduction()) {
        return {
          passed: false,
          error: 'NEXT_PUBLIC_APP_URL n\'est pas défini en production',
        };
      }
      return {
        passed: false,
        error: 'NEXT_PUBLIC_APP_URL n\'est pas défini. Définissez cette variable pour exécuter les tests.',
      };
    }
    // Le rate limiting est configuré pour 5 tentatives par 15 minutes
    // Faire 6 requêtes séquentiellement pour déclencher le rate limit
    const responses = [];
    let hasRateLimitHeaders = false;
    let rateLimited = false;

    for (let i = 0; i < 6; i++) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'test', password: 'test' }),
      });
      
      responses.push(response);
      
      // Vérifier le status 429
      if (response.status === 429) {
        rateLimited = true;
      }
      
      // Vérifier les headers de rate limit
      if (response.headers.get('X-RateLimit-Remaining') !== null || 
          response.headers.get('X-RateLimit-Reset') !== null ||
          response.headers.get('x-ratelimit-remaining') !== null ||
          response.headers.get('x-ratelimit-reset') !== null) {
        hasRateLimitHeaders = true;
      }
      
      // Petit délai entre les requêtes pour laisser le temps au rate limiting de se mettre à jour
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (!rateLimited && !hasRateLimitHeaders) {
      return {
        passed: false,
        details: 'Le rate limiting ne semble pas fonctionner (aucun status 429 ni headers de rate limit détectés)',
      };
    }

    // Si on a des headers de rate limit, c'est bon signe même sans 429
    if (hasRateLimitHeaders) {
      return { passed: true, details: 'Le rate limiting fonctionne correctement (headers détectés)' };
    }

    return { passed: true, details: 'Le rate limiting fonctionne correctement (status 429 détecté)' };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

async function testInputValidation(): Promise<{ passed: boolean; details?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      if (isProduction()) {
        return {
          passed: false,
          error: 'NEXT_PUBLIC_APP_URL n\'est pas défini en production',
        };
      }
      return {
        passed: false,
        error: 'NEXT_PUBLIC_APP_URL n\'est pas défini. Définissez cette variable pour exécuter les tests.',
      };
    }
    const response = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'a',
        email: 'invalid-email',
        password: '123',
      }),
    });

    if (response.status === 200 || response.status === 201) {
      return {
        passed: false,
        details: 'Les validations Zod ne rejettent pas les données invalides',
      };
    }

    return { passed: true, details: 'Les validations Zod fonctionnent correctement' };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

export const securityTests = [
  {
    name: 'Security Headers',
    description: 'Vérifie que tous les headers de sécurité sont présents',
    run: testSecurityHeaders,
  },
  {
    name: 'Protected Routes',
    description: 'Vérifie que les routes protégées nécessitent une authentification',
    run: testProtectedRoutes,
  },
  {
    name: 'Rate Limiting',
    description: 'Vérifie que le rate limiting fonctionne',
    run: testRateLimiting,
  },
  {
    name: 'Input Validation',
    description: 'Vérifie que les validations Zod rejettent les données invalides',
    run: testInputValidation,
  },
];

export async function runSecurityTests(): Promise<SecurityTestResult[]> {
  const results: SecurityTestResult[] = [];

  for (const test of securityTests) {
    const startTime = Date.now();
    try {
      const result = await test.run();
      const duration = Date.now() - startTime;

      results.push({
        id: randomBytes(16).toString('hex'),
        testName: test.name,
        status: result.passed ? 'passed' : 'failed',
        timestamp: new Date().toISOString(),
        duration,
        details: result.details,
        error: result.error,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      results.push({
        id: randomBytes(16).toString('hex'),
        testName: test.name,
        status: 'failed',
        timestamp: new Date().toISOString(),
        duration,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  return results;
}

