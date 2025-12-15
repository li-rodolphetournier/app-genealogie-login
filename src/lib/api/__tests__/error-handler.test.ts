import { describe, it, expect, vi } from 'vitest';
import { createErrorResponse, validateRequestParams } from '../error-handler';
import { logger } from '@/lib/utils/logger';

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe('api/error-handler', () => {
  it('createErrorResponse retourne 401/403 pour les erreurs d’authentification', async () => {
    const res401 = createErrorResponse(
      new Error('Non authentifié: token manquant'),
      500,
      { route: '/test' },
    );
    expect(res401.status).toBe(401);

    const res403 = createErrorResponse(
      new Error('Accès refusé: admin requis'),
      500,
      { route: '/test' },
    );
    expect(res403.status).toBe(403);
  });

  it('validateRequestParams signale les paramètres manquants', async () => {
    const result = validateRequestParams({ a: 1 }, ['a', 'b']);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error.status).toBe(400);
    }
  });
});


