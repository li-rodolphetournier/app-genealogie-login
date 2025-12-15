/**
 * Tests pour la route /api/auth/admin/password-reset-logs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../admin/password-reset-logs/route';
import { getAuthenticatedUser } from '@/lib/auth/middleware';
import { getPasswordResetLogs } from '@/lib/audit/password-reset-logger';

vi.mock('@/lib/auth/middleware', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/audit/password-reset-logger', () => ({
  getPasswordResetLogs: vi.fn(),
}));

describe('/api/auth/admin/password-reset-logs', () => {
  const createRequest = (url: string) => new Request(url, { method: 'GET' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner les logs pour un administrateur', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'admin-1',
        login: 'admin',
        status: 'administrateur',
      },
    } as any);

    vi.mocked(getPasswordResetLogs).mockResolvedValue([
      {
        id: 'log-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        actionType: 'reset_password',
        timestamp: '2024-01-01T00:00:00.000Z',
        ipAddress: '127.0.0.1',
      },
    ] as any);

    const request = createRequest(
      'http://localhost:3000/api/auth/admin/password-reset-logs?userEmail=user@example.com&limit=10',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Logs récupérés avec succès');
    expect(data.data).toHaveLength(1);
    expect(getPasswordResetLogs).toHaveBeenCalledWith(
      undefined,
      'user@example.com',
      10,
    );
  });

  it('devrait refuser l’accès si l’utilisateur n’est pas administrateur', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'user-1',
        login: 'user',
        status: 'utilisateur',
      },
    } as any);

    const request = createRequest(
      'http://localhost:3000/api/auth/admin/password-reset-logs',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Administrateur requis');
  });

  it('devrait retourner 500 en cas d’erreur serveur', async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue({
      user: {
        id: 'admin-1',
        login: 'admin',
        status: 'administrateur',
      },
    } as any);

    vi.mocked(getPasswordResetLogs).mockRejectedValue(new Error('boom'));

    const request = createRequest(
      'http://localhost:3000/api/auth/admin/password-reset-logs',
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Erreur serveur');
  });
});


