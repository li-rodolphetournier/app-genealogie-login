import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoHide } from '../use-auto-hide';

describe('useAutoHide', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('devrait initialiser avec isVisible à true par défaut', () => {
    const { result } = renderHook(() => useAutoHide({ delay: 1000 }));
    
    expect(result.current.isVisible).toBe(true);
  });

  it('devrait initialiser avec isVisible à false si initialVisible est false', () => {
    const { result } = renderHook(() => 
      useAutoHide({ delay: 1000, initialVisible: false })
    );
    
    expect(result.current.isVisible).toBe(false);
  });

  it('devrait cacher après le délai spécifié', () => {
    const { result } = renderHook(() => useAutoHide({ delay: 1000 }));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.isVisible).toBe(false);
  });

  it('devrait montrer quand show est appelé', () => {
    const { result } = renderHook(() => useAutoHide({ delay: 1000 }));
    
    act(() => {
      result.current.hide();
      vi.advanceTimersByTime(500);
      result.current.show();
    });
    
    expect(result.current.isVisible).toBe(true);
  });

  it('devrait annuler le timeout quand show est appelé', () => {
    const { result } = renderHook(() => useAutoHide({ delay: 1000 }));
    
    act(() => {
      result.current.hide();
      vi.advanceTimersByTime(500);
      result.current.show();
      vi.advanceTimersByTime(1000);
    });
    
    // Ne devrait pas être caché car show a été appelé
    expect(result.current.isVisible).toBe(true);
  });

  it('devrait ne pas cacher si hovered', () => {
    const { result } = renderHook(() => useAutoHide({ delay: 1000 }));
    
    act(() => {
      result.current.handleMouseEnter();
    });
    
    act(() => {
      result.current.handleMouseLeave();
      vi.advanceTimersByTime(500);
      result.current.handleMouseEnter();
      vi.advanceTimersByTime(1000);
    });
    
    // Ne devrait pas être caché car hovered
    expect(result.current.isVisible).toBe(true);
  });
});

