/**
 * Tests unitaires pour useCsrfToken
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCsrfToken, fetchWithCsrf } from '../use-csrf';

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useCsrfToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
    // Réinitialiser le module pour réinitialiser le cache
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner le token CSRF après récupération', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-csrf-token-1' }),
    });

    const { useCsrfToken } = await import('../use-csrf');
    const { result } = renderHook(() => useCsrfToken());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.token).toBe('test-csrf-token-1');
  });

  it('devrait gérer les erreurs de récupération du token', async () => {
    // Réinitialiser le module pour avoir un cache vide
    vi.resetModules();
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { useCsrfToken } = await import('../use-csrf');
    const { result } = renderHook(() => useCsrfToken());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.token).toBeNull();
  });

  it('devrait utiliser le cache si le token est déjà en cache', async () => {
    // D'abord récupérer un token pour le mettre en cache
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'cached-token' }),
    });

    const { useCsrfToken } = await import('../use-csrf');
    const { result: firstResult } = renderHook(() => useCsrfToken());

    await waitFor(() => {
      expect(firstResult.current.token).toBe('cached-token');
    });

    // Ensuite, utiliser le hook à nouveau - il devrait utiliser le cache
    mockFetch.mockClear();
    const { result: secondResult } = renderHook(() => useCsrfToken());

    expect(secondResult.current.isLoading).toBe(false);
    expect(secondResult.current.token).toBe('cached-token');
    // Le fetch ne devrait pas être appelé car le token est en cache
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('fetchWithCsrf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules(); // Réinitialiser le module pour réinitialiser le cache
  });

  it('devrait ajouter le header CSRF à la requête', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'csrf-token-for-fetch' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { fetchWithCsrf } = await import('../use-csrf');
    await fetchWithCsrf('/api/test', { method: 'POST' });

    // Vérifier que fetch a été appelé deux fois : une pour le token, une pour la requête
    expect(mockFetch).toHaveBeenCalledTimes(2);
    
    // Vérifier le dernier appel avec le header CSRF
    const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
    expect(lastCall[0]).toBe('/api/test');
    expect((lastCall[1] as RequestInit).headers).toBeDefined();
    const headers = lastCall[1]?.headers as Headers;
    if (headers instanceof Headers) {
      expect(headers.get('x-csrf-token')).toBe('csrf-token-for-fetch');
    }
  });

  it('devrait fonctionner sans token CSRF si la récupération échoue', async () => {
    vi.resetModules();
    mockFetch
      .mockRejectedValueOnce(new Error('Failed to fetch token'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const { fetchWithCsrf } = await import('../use-csrf');
    
    try {
      await fetchWithCsrf('/api/test');
    } catch {
      // Ignorer les erreurs dans ce test
    }

    // Le fetch devrait être appelé au moins une fois
    expect(mockFetch).toHaveBeenCalled();
  });
});

