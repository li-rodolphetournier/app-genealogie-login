/**
 * Tests unitaires pour le hook useAuth
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../use-auth';
import { createClient } from '@/lib/supabase/client';

// Mock du client Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

// Mock de Next.js router
const mockPush = vi.fn();
const mockRouter = {
  push: mockPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('useAuth', () => {
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockReturnValue(mockSupabaseClient);
  });

  it('devrait initialiser avec un état de chargement', () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('devrait retourner null si aucun utilisateur n\'est trouvé', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No user found' },
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('devrait charger un utilisateur existant', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockProfile = {
      id: '1',
      login: 'testuser',
      email: 'test@example.com',
      status: 'utilisateur',
      description: null,
      profile_image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        })),
      })),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('devrait rediriger si redirectIfUnauthenticated est true et aucun utilisateur', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'No user found' },
    });

    renderHook(() =>
      useAuth({
        redirectIfUnauthenticated: true,
        redirectTo: '/login',
      })
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('devrait appeler signOut lors de la déconnexion', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.logout();

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

