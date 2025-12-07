/**
 * Utilitaire de logging conditionnel
 * Affiche les logs uniquement en mode développement
 */

const getIsDevelopment = (): boolean => process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (getIsDevelopment()) {
      console.log(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (getIsDevelopment()) {
      console.debug(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (getIsDevelopment()) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (getIsDevelopment()) {
      console.info(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Les erreurs sont toujours loggées, même en production
    console.error(...args);
  },
};

