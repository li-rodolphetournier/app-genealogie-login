import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../use-local-storage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it('devrait retourner la valeur initiale si aucune clé en localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('default');
  });

  it('devrait lire la valeur existante depuis localStorage', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    expect(result.current[0]).toBe('stored');
  });

  it('devrait mettre à jour le state et localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));

    act(() => {
      result.current[1](1);
    });

    expect(result.current[0]).toBe(1);
    expect(JSON.parse(window.localStorage.getItem('test-key') || '0')).toBe(1);
  });

  it('devrait supprimer la valeur et réinitialiser au initialValue', () => {
    window.localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[2]();
    });

    expect(result.current[0]).toBe('default');
    expect(window.localStorage.getItem('test-key')).toBeNull();
  });
});


