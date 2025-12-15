import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenealogyZoom } from '../use-genealogy-zoom';

describe('useGenealogyZoom', () => {
  it('devrait initialiser avec le zoom par défaut', () => {
    const { result } = renderHook(() => useGenealogyZoom());
    expect(result.current.zoomLevel).toBe(1.0);
  });

  it('devrait augmenter et diminuer le zoom dans les bornes', () => {
    const { result } = renderHook(() => useGenealogyZoom(1.0, 0.5, 1.5));

    act(() => {
      result.current.zoomIn();
    });
    expect(result.current.zoomLevel).toBeCloseTo(1.1, 5);

    act(() => {
      result.current.zoomOut();
      result.current.zoomOut();
      result.current.zoomOut();
    });
    expect(result.current.zoomLevel).toBeGreaterThanOrEqual(0.5);
  });

  it('devrait appliquer setZoom avec clamp min/max', () => {
    const { result } = renderHook(() => useGenealogyZoom(1.0, 0.5, 1.5));

    act(() => {
      result.current.setZoom(2.0);
    });
    expect(result.current.zoomLevel).toBe(1.5);

    act(() => {
      result.current.setZoom(0.1);
    });
    expect(result.current.zoomLevel).toBe(0.5);
  });
});


