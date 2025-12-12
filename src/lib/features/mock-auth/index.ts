/**
 * Module Mock Auth - Feature isolée
 * Toute la logique de mock d'authentification est contenue ici
 * Peut être complètement désactivée via feature flag
 */

export { isMockModeEnabled, createMockUser, isMockUserId } from './mock';

