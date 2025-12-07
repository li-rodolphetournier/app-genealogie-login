/**
 * Types communs et utilitaires
 */

/**
 * Statut de publication
 */
export type PublicationStatus = 'publie' | 'brouillon';

/**
 * Statut utilisateur
 */
export type UserStatus = 'administrateur' | 'utilisateur' | 'redacteur';

/**
 * Genre pour la généalogie
 */
export type Gender = 'homme' | 'femme';

/**
 * Réponse API standard
 */
export type ApiResponse<T = unknown> = 
  | { success: true; data: T }
  | { success: false; error: string; message?: string };

/**
 * Option pour les selects
 */
export type SelectOption<T = string> = {
  value: T;
  label: string;
};

