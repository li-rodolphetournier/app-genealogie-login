/**
 * Tests unitaires pour les messages d'erreur
 */

import { describe, it, expect } from 'vitest';
import { getErrorMessage, formatErrorMessage, ERROR_MESSAGES } from '../messages';

describe('messages d\'erreur', () => {
  describe('getErrorMessage', () => {
    it('devrait retourner le message correspondant à la clé', () => {
      const message = getErrorMessage('USER_NOT_FOUND');
      expect(message).toBe("L'utilisateur demandé n'existe pas.");
    });

    it('devrait retourner le message générique si la clé n\'existe pas', () => {
      const message = getErrorMessage('UNKNOWN_KEY' as any);
      expect(message).toBe(ERROR_MESSAGES.GENERIC);
    });
  });

  describe('formatErrorMessage', () => {
    it('devrait formater un message avec des variables', () => {
      // Note: Les messages actuels n'utilisent pas de variables, mais la fonction est prête
      const message = formatErrorMessage('GENERIC');
      expect(message).toBe(ERROR_MESSAGES.GENERIC);
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('devrait contenir tous les messages d\'erreur', () => {
      expect(ERROR_MESSAGES.GENERIC).toBeDefined();
      expect(ERROR_MESSAGES.USER_NOT_FOUND).toBeDefined();
      expect(ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS).toBeDefined();
      expect(ERROR_MESSAGES.FILE_UPLOAD_FAILED).toBeDefined();
    });
  });
});

