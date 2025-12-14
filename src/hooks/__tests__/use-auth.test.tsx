/**
 * Tests unitaires pour le hook useAuth
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
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

// Mock de fetch pour les appels API
global.fetch = vi.fn();

// Mock de window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    pathname: '/',
    search: '',
    hostname: 'localhost',
  },
  writable: true,
});

// Mock de navigator
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  writable: true,
});

// Mock de sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

describe('useAuth', () => {
  let mockAuthStateChangeCallback: ((event: string, session: any) => void) | null = null;
  const mockUnsubscribe = vi.fn();
  
  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn((callback) => {
        mockAuthStateChangeCallback = callback;
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        };
      }),
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
    mockAuthStateChangeCallback = null;
    (createClient as any).mockReturnValue(mockSupabaseClient);
    (global.fetch as any).mockClear();
    sessionStorageMock.getItem.mockReturnValue(null);
    window.location.href = '';
    window.location.pathname = '/';
    window.location.search = '';
    window.location.hostname = 'localhost';
    // Ne pas utiliser fake timers car use-auth utilise beaucoup de setTimeout
    // vi.useFakeTimers();
  });

  afterEach(() => {
    // vi.useRealTimers();
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
    // Note: Le logout utilise maintenant window.location.href au lieu de router.push
    // pour forcer un rechargement complet de la page, donc on ne vérifie plus mockPush
    // expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('devrait gérer les erreurs lors de la récupération du profil via API', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: '1',
              login: 'testuser',
              email: 'test@example.com',
              status: 'utilisateur',
            },
            error: null,
          }),
        })),
      })),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.login).toBe('testuser');
  });

  it('devrait gérer les erreurs lors de la récupération du profil via Supabase direct', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        })),
      })),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    // Devrait créer un utilisateur minimal depuis auth
    expect(result.current.user).toBeTruthy();
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('devrait gérer l\'événement SIGNED_IN', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockSession = {
      user: mockUser,
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simuler l'événement SIGNED_IN
    if (mockAuthStateChangeCallback) {
      await act(async () => {
        mockAuthStateChangeCallback('SIGNED_IN', mockSession);
      });
    }

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('devrait gérer l\'événement SIGNED_OUT', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { id: '1', login: 'testuser', email: 'test@example.com', status: 'utilisateur' } }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    }, { timeout: 10000 });

    // Simuler l'événement SIGNED_OUT
    if (mockAuthStateChangeCallback) {
      await act(async () => {
        mockAuthStateChangeCallback('SIGNED_OUT', null);
      });
    }

    await waitFor(() => {
      expect(result.current.user).toBeNull();
    });
  });

  it('devrait gérer l\'événement INITIAL_SESSION', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockSession = {
      user: mockUser,
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: '1',
              login: 'testuser',
              email: 'test@example.com',
              status: 'utilisateur',
            },
            error: null,
          }),
        })),
      })),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simuler l'événement INITIAL_SESSION
    if (mockAuthStateChangeCallback) {
      await act(async () => {
        mockAuthStateChangeCallback('INITIAL_SESSION', mockSession);
      });
    }

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    }, { timeout: 5000 });
  });

  it('devrait gérer les erreurs lors du logout', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: { message: 'Sign out error' },
    });

    (global.fetch as any).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Le logout devrait quand même rediriger même en cas d'erreur
    await act(async () => {
      await result.current.logout();
    });

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    // window.location.href devrait être défini même en cas d'erreur
    expect(window.location.href).toBe('/');
  });

  it('devrait retourner userStatus correctement', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
    };

    const mockProfile = {
      id: '1',
      login: 'testuser',
      email: 'test@example.com',
      status: 'administrateur',
      description: null,
      profile_image: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ user: mockProfile }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    expect(result.current.userStatus).toBe('administrateur');
  });

  it('devrait gérer le cas où le profil API retourne un utilisateur mock', async () => {
    const mockUser = {
      id: 'mock-123',
      email: 'mock@example.com',
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        user: { 
          id: 'mock-123', 
          login: 'mockuser', 
          email: 'mock@example.com', 
          status: 'utilisateur' 
        } 
      }),
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 10000 });

    // Devrait détecter le mode mock et charger l'utilisateur
    expect(result.current.user).toBeTruthy();
  });
});

