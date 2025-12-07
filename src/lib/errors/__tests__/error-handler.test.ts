/**
 * Tests unitaires pour error-handler
 */

import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createErrorResponse, logError } from '../error-handler';
import { ValidationError, NotFoundError } from '../app-error';

describe('createErrorResponse', () => {
  it('devrait formater une erreur de validation Zod', async () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    const result = schema.safeParse({
      email: 'invalid-email',
      age: 15,
    });

    if (!result.success) {
      const response = createErrorResponse(result.error);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBeDefined();
      expect(json.details).toBeDefined();
    }
  });

  it('devrait formater une ValidationError', async () => {
    const error = new ValidationError('Invalid input');
    const response = createErrorResponse(error);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Invalid input');
    expect(json.code).toBe('VALIDATION_ERROR');
  });

  it('devrait formater une NotFoundError', async () => {
    const error = new NotFoundError('User');
    const response = createErrorResponse(error);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toContain('User'); // Le message est formaté avec "non trouvé(e)"
    expect(json.code).toBe('NOT_FOUND');
  });

  it('devrait formater une Error générique', async () => {
    const error = new Error('Generic error');
    const response = createErrorResponse(error);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBeDefined();
    expect(json.code).toBe('INTERNAL_SERVER_ERROR');
  });
});

describe('logError', () => {
  it('devrait logger une erreur avec contexte', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Test error');

    logError(error, 'TestContext');

    expect(consoleSpy).toHaveBeenCalled();
    // logError formate l'erreur dans un objet avec timestamp et contexte
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('TestContext'),
      expect.objectContaining({
        message: 'Test error',
      })
    );

    consoleSpy.mockRestore();
  });
});

