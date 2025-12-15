import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGenealogyDimensions } from '../use-genealogy-dimensions';

describe('useGenealogyDimensions', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, writable: true });
  });

  it('devrait calculer les dimensions en fonction du menu et du header', () => {
    const { result, rerender } = renderHook(
      ({ open }) => useGenealogyDimensions(open, 100),
      { initialProps: { open: false } },
    );

    expect(result.current.width).toBe(1200);
    expect(result.current.height).toBe(700);

    rerender({ open: true });
    expect(result.current.width).toBe(1200 - 384);
  });
});


