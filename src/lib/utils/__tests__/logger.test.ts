/**
 * Tests unitaires pour le logger
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleDebug = console.debug;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.debug = originalConsoleDebug;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
  });

  describe('en développement', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('devrait logger en développement', () => {
      const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log('test');
      expect(mockLog).toHaveBeenCalledWith('test');
    });

    it('devrait debugger en développement', () => {
      const mockDebug = vi.spyOn(console, 'debug').mockImplementation(() => {});
      logger.debug('test');
      expect(mockDebug).toHaveBeenCalledWith('test');
    });

    it('devrait logger les erreurs même en développement', () => {
      const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('error');
      expect(mockError).toHaveBeenCalledWith('error');
    });
  });

  describe('en production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('ne devrait pas logger en production', () => {
      const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.log('test');
      expect(mockLog).not.toHaveBeenCalled();
    });

    it('devrait toujours logger les erreurs en production', () => {
      const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
      logger.error('error');
      expect(mockError).toHaveBeenCalledWith('error');
    });
  });
});

