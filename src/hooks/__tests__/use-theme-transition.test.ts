import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeTransition } from '../use-theme-transition';

describe('useThemeTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('devrait initialiser avec isTransitioning à false', () => {
    const toggleTheme = vi.fn();
    const { result } = renderHook(() => 
      useThemeTransition({ toggleTheme })
    );
    
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.transitionTheme).toBe(null);
  });

  it('devrait démarrer une transition et appeler toggleTheme', () => {
    const toggleTheme = vi.fn();
    const { result } = renderHook(() => 
      useThemeTransition({ toggleTheme })
    );
    
    act(() => {
      result.current.startTransition('dark');
    });
    
    expect(result.current.isTransitioning).toBe(true);
    expect(result.current.transitionTheme).toBe('dark');
    
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    expect(toggleTheme).toHaveBeenCalled();
  });

  it('devrait nettoyer la transition après le délai', () => {
    const toggleTheme = vi.fn();
    const { result } = renderHook(() => 
      useThemeTransition({ toggleTheme })
    );
    
    act(() => {
      result.current.startTransition('dark');
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(200);
    });
    
    expect(result.current.isTransitioning).toBe(false);
    expect(result.current.transitionTheme).toBe(null);
  });

  it('devrait appeler onTransitionEnd après la transition', () => {
    const toggleTheme = vi.fn();
    const onTransitionEnd = vi.fn();
    const { result } = renderHook(() => 
      useThemeTransition({ toggleTheme, onTransitionEnd })
    );
    
    act(() => {
      result.current.startTransition('dark');
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(200);
    });
    
    expect(onTransitionEnd).toHaveBeenCalled();
  });
});

