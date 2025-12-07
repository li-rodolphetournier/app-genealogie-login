/**
 * Système de rate limiting avec Upstash Redis
 * Fallback en mémoire si Upstash n'est pas configuré (développement)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Options de rate limiting
 */
export type RateLimitOptions = {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes
  identifier?: string; // Identifiant unique (IP, user ID, etc.)
};

/**
 * Type de retour pour checkRateLimit
 */
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

// Configuration Redis (Upstash)
const isUpstashConfigured =
  typeof process.env.UPSTASH_REDIS_REST_URL !== 'undefined' &&
  typeof process.env.UPSTASH_REDIS_REST_TOKEN !== 'undefined';

let redis: Redis | null = null;
let ratelimiters: Map<string, Ratelimit> | null = null;

// Initialiser Redis si configuré
if (isUpstashConfigured) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    ratelimiters = new Map();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation d\'Upstash Redis:', error);
    redis = null;
    ratelimiters = null;
  }
}

// Store en mémoire pour fallback (développement uniquement)
type RateLimitStore = Map<string, { count: number; resetAt: number }>;
const rateLimitStore: RateLimitStore = new Map();

/**
 * Convertit windowMs en format Upstash (ex: '15 m', '1 h')
 */
function formatUpstashWindow(windowMs: number): string {
  const seconds = Math.floor(windowMs / 1000);
  
  if (seconds < 60) {
    return `${seconds} s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    return `${hours} h`;
  }
}

/**
 * Vérifie si une requête dépasse la limite de taux (avec Upstash Redis)
 */
export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { windowMs, maxRequests } = options;
  const now = Date.now();
  const key = `${identifier}:${options.identifier || 'default'}`;

  // Utiliser Upstash Redis si configuré
  if (redis && ratelimiters) {
    try {
      // Créer ou récupérer un rate limiter pour cette configuration
      const configKey = `${windowMs}:${maxRequests}`;
      
      if (!ratelimiters.has(configKey)) {
        const windowStr = formatUpstashWindow(windowMs);
        ratelimiters.set(
          configKey,
          new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(maxRequests, windowStr),
            analytics: true,
          })
        );
      }

      const ratelimit = ratelimiters.get(configKey)!;
      const result = await ratelimit.limit(key);

      // Calculer resetAt approximatif
      const resetAt = now + windowMs;

      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt,
      };
    } catch (error) {
      console.error('Erreur lors du rate limiting avec Upstash:', error);
      // Fallback vers la mémoire en cas d'erreur
    }
  }

  // Fallback en mémoire (développement)
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Nouvelle fenêtre
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  // Incrémenter le compteur
  entry.count += 1;
  rateLimitStore.set(key, entry);

  const remaining = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
  };
}

/**
 * Nettoie les anciennes entrées du store (fallback mémoire uniquement)
 * @deprecated Plus nécessaire avec Upstash Redis
 */
export function cleanupRateLimitStore(): void {
  if (!isUpstashConfigured && rateLimitStore.size > 0) {
    const now = Date.now();
    const keysToDelete: string[] = [];

    rateLimitStore.forEach((value, key) => {
      if (value.resetAt < now) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => rateLimitStore.delete(key));
  }
}

/**
 * Récupère l'identifiant de la requête (IP ou user ID)
 */
export function getRequestIdentifier(request: Request): string {
  // Essayer de récupérer l'IP depuis les headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || 'unknown';

  return ip;
}

/**
 * Configurations de rate limiting par route
 */
export const rateLimitConfigs = {
  // Login : 5 tentatives par 15 minutes
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // API générale : 100 requêtes par minute
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Création utilisateur : 10 par minute
  createUser: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const;
