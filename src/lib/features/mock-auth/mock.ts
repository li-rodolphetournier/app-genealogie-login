/**
 * Utilitaire pour créer un utilisateur mock avec accès admin
 * Module isolé pour la feature Mock Auth
 * UNIQUEMENT pour les tests en développement
 */

import { isMockAuthEnabled } from '../flags';
import type { User } from '@/types/user';

/**
 * Vérifie si le mode mock est activé
 * Contrôlé par la feature flag
 */
export function isMockModeEnabled(): boolean {
  return isMockAuthEnabled();
}

/**
 * Crée un utilisateur mock avec accès administrateur
 * @param mockId - ID du mock (peut être n'importe quelle valeur)
 */
export function createMockUser(mockId: string): User {
  const now = new Date().toISOString();
  
  return {
    id: `mock-${mockId}`,
    login: `mock-admin-${mockId}`,
    email: `mock-admin-${mockId}@example.com`,
    status: 'administrateur',
    description: `Utilisateur mock pour tests (ID: ${mockId})`,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Vérifie si un ID est un ID mock
 */
export function isMockUserId(id: string): boolean {
  return id.startsWith('mock-');
}

