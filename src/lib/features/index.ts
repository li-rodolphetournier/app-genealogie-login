/**
 * Point d'entrée centralisé pour toutes les features
 * Permet d'importer facilement les features avec leurs flags
 */

// Feature flags
export { isAuthDebugEnabled, isMockAuthEnabled } from './flags';

// Auth Debug Feature
export { 
  authLogger, 
  logAuth, 
  type AuthLogEntry, 
  type AuthLogLevel,
  AuthDebugPanel,
  AuthDebugPanelWrapper
} from './auth-debug';

// Mock Auth Feature
export { 
  isMockModeEnabled, 
  createMockUser, 
  isMockUserId 
} from './mock-auth';

