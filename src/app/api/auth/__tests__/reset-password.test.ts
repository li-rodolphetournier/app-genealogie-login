/**
 * Tests pour la route /api/auth/reset-password
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../reset-password/route';
import { createClient } from '@/lib/supabase/server';
import { logPasswordResetAction, getIpAddress, getUserAgent } from '@/lib/audit/password-reset-logger';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/audit/password-reset-logger', () => ({
  logPasswordResetAction: vi.fn().mockResolvedValue(undefined),
  getIpAddress: vi.fn(() => '127.0.0.1'),
  getUserAgent: vi.fn(() => 'test-agent'),
}));

const createSupabaseMock = () => ({
  auth: {
    exchangeCodeForSession: vi.fn(),
    verifyOtp: vi.fn(),
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
});

describe('/api/auth/reset-password', () => {
  const mockSupabase = createSupabaseMock();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabase as any);
  });

  const createRequest = (body: unknown) =>
    new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    });

  it('devrait rejeter un mot de passe trop court (validation Zod)', async () => {
    const response = await POST(
      createRequest({
        token: 'token',
        password: '123',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('6 caractères');
  });

  it('devrait utiliser la session existante si useSession est à true', async () => {
    const user = { id: 'user-1', email: 'user@example.com' };

    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    const response = await POST(
      createRequest({
        password: 'nouveau-mdp-123',
        useSession: true,
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Mot de passe réinitialisé');
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: 'nouveau-mdp-123',
    });
    expect(logPasswordResetAction).toHaveBeenCalled();
  });

  it('devrait utiliser exchangeCodeForSession avec un token et mettre à jour le mot de passe', async () => {
    const user = { id: 'user-2', email: 'token@example.com' };

    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    mockSupabase.auth.updateUser.mockResolvedValueOnce({
      data: { user },
      error: null,
    });

    const response = await POST(
      createRequest({
        token: 'exchange-code',
        password: 'password-123456',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('Mot de passe réinitialisé');
    expect(mockSupabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('exchange-code');
    expect(mockSupabase.auth.updateUser).toHaveBeenCalled();
  });

  it('devrait retourner 400 si aucun utilisateur ne peut être vérifié avec le token', async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid code' },
    });

    mockSupabase.auth.verifyOtp.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'invalid token' },
    });

    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'no session' },
    });

    const response = await POST(
      createRequest({
        token: 'bad-token',
        password: 'password-123456',
      }),
    );
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Token invalide ou expiré');
  });
});


