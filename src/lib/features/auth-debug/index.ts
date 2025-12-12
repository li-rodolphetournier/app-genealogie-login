/**
 * Module Auth Debug - Feature isolée
 * Toute la logique de debug d'authentification est contenue ici
 * Peut être complètement désactivée via feature flag
 */

export { authLogger, logAuth, type AuthLogEntry, type AuthLogLevel } from './auth-logger';
export { AuthDebugPanel } from './AuthDebugPanel';
export { AuthDebugPanelWrapper } from './AuthDebugPanelWrapper';

