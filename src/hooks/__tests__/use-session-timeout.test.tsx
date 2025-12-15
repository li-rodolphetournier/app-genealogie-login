import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from '../use-session-timeout';
import { useAuth } from '../use-auth';
import { createClient } from '@/lib/supabase/client';

vi.mock('../use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));

describe('useSessionTimeout', () => {
  const mockLogout = vi.fn();
  const mockSupabase = {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn().mockResolvedValue(undefined),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'u1' },
      logout: mockLogout,
    } as any);
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  it('devrait exposer l’état initial sans avertissement', () => {
    const { result } = renderHook(() => useSessionTimeout({ enabled: true }));

    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsRemaining).toBeGreaterThan(0);
  });

  it('devrait déclencher handleStayActive et rafraîchir la session', async () => {
    const { result } = renderHook(() => useSessionTimeout({ enabled: true }));

    await act(async () => {
      await result.current.handleStayActive();
    });

    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
  });

  it('devrait appeler logout via handleLogout', () => {
    const { result } = renderHook(() => useSessionTimeout({ enabled: true }));

    act(() => {
      result.current.handleLogout();
    });

    expect(mockLogout).toHaveBeenCalled();
  });
});


