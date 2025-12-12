/**
 * Tests de sécurité automatisés
 */

import type { SecurityTestResult } from '@/lib/monitoring/types';
import { randomBytes } from 'crypto';

export interface SecurityTest {
  name: string;
  description: string;
  run: () => Promise<{ passed: boolean; details?: string; error?: string }>;
}

async function testSecurityHeaders(): Promise<{ passed: boolean; details?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(baseUrl, {
      method: 'HEAD',
    });

    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'strict-transport-security',
      'content-security-policy',
    ];

    const missingHeaders: string[] = [];
    requiredHeaders.forEach(header => {
      if (!response.headers.get(header)) {
        missingHeaders.push(header);
      }
    });

    if (missingHeaders.length > 0) {
      return {
        passed: false,
        details: `Headers manquants: ${missingHeaders.join(', ')}`,
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const protectedRoutes = ['/accueil', '/users', '/messages'];
    const results: string[] = [];

    for (const route of protectedRoutes) {
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'GET',
        redirect: 'manual',
      });

      if (response.status !== 401 && response.status !== 403 && response.status !== 307 && response.status !== 308) {
        results.push(`${route} (status: ${response.status})`);
      }
    }

    if (results.length > 0) {
      return {
        passed: false,
        details: `Routes non protégées: ${results.join(', ')}`,
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const requests = Array.from({ length: 10 }, () =>
      fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'test', password: 'test' }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);

    if (!rateLimited) {
      return {
        passed: false,
        details: 'Le rate limiting ne semble pas fonctionner',
      };
    }

    return { passed: true, details: 'Le rate limiting fonctionne correctement' };
  } catch (error) {
    return {
      passed: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

async function testInputValidation(): Promise<{ passed: boolean; details?: string; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

