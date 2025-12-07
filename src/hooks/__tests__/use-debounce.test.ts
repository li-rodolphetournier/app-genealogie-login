/**
 * Tests unitaires pour le hook useDebounce
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../use-debounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('devrait retourner la valeur initiale immédiatement', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('devrait debouncer les changements de valeur', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    // Changer la valeur
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Pas encore mis à jour

    // Avancer le temps de 499ms
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial'); // Toujours pas mis à jour

    // Avancer le temps de 1ms de plus
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated'); // Maintenant mis à jour
  });

  it('devrait annuler le debounce précédent si la valeur change avant la fin du délai', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    // Changer rapidement plusieurs fois
    rerender({ value: 'second', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'third', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current).toBe('first'); // Pas encore mis à jour

    // Attendre le délai complet après le dernier changement
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('third'); // Seule la dernière valeur
  });

  it('devrait fonctionner avec différents délais', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });
});

