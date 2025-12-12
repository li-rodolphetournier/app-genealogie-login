/**
 * Système de feature flags centralisé
 * Permet d'activer/désactiver des fonctionnalités depuis les variables d'environnement
 */

/**
 * Vérifie si la feature Auth Debug est activée
 * Peut être désactivée via NEXT_PUBLIC_ENABLE_AUTH_DEBUG=false
 */
export function isAuthDebugEnabled(): boolean {
  // Par défaut activé en développement, peut être désactivé via env
  if (process.env.NEXT_PUBLIC_ENABLE_AUTH_DEBUG === 'false') {
    return false;
  }
  
  // En production, uniquement si explicitement activé
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_ENABLE_AUTH_DEBUG === 'true';
  }
  
  // En développement, activé par défaut
  return true;
}

/**
 * Vérifie si la feature Mock No Login est activée
 * Peut être désactivée via NEXT_PUBLIC_ENABLE_MOCK_AUTH=false
 */
export function isMockAuthEnabled(): boolean {
  // Par défaut activé en développement, peut être désactivé via env
  if (process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'false') {
    return false;
  }
  
  // En production, JAMAIS activé (sécurité)
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // En développement, activé par défaut
  return true;
}

