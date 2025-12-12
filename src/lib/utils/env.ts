/**
 * Utilitaires pour vérifier l'environnement d'exécution
 */

/**
 * Vérifie si l'application est en production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Vérifie si l'application est en développement
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Vérifie si l'application est en mode test
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

