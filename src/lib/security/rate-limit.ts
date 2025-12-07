/**
 * Système de rate limiting simple en mémoire
 * Pour la production, utiliser Redis ou un service dédié
 */

type RateLimitStore = Map<string, { count: number; resetAt: number }>;

// Store en mémoire (à remplacer par Redis en production)
const rateLimitStore: RateLimitStore = new Map();

/**
 * Options de rate limiting
 */
export type RateLimitOptions = {
  windowMs: number; // Fenêtre de temps en millisecondes
  maxRequests: number; // Nombre maximum de requêtes
  identifier?: string; // Identifiant unique (IP, user ID, etc.)
};

/**
 * Vérifie si une requête dépasse la limite de taux
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetAt: number } {
  const { windowMs, maxRequests } = options;
  const now = Date.now();
  const key = `${identifier}:${options.identifier || 'default'}`;

  // Récupérer ou créer l'entrée
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
 * Nettoie les anciennes entrées du store (à appeler périodiquement)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((value, key) => {
    if (value.resetAt < now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitStore.delete(key));
}

/**
 * Récupère l'identifiant de la requête (IP ou user ID)
 */
export function getRequestIdentifier(request: Request): string {
  // Essayer de récupérer l'IP depuis les headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

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

