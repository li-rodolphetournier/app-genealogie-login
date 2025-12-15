import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useGenealogyDrag } from '../use-genealogy-drag';

describe('useGenealogyDrag', () => {
  const createSvgRef = () => {
    const element = {
      getBoundingClientRect: vi.fn().mockReturnValue({
        left: 0,
        top: 0,
      }),
    } as unknown as SVGSVGElement;
    const ref = { current: element };
    return ref;
  };

  it('met à jour translate lors du drag de fond', () => {
    const onTranslateUpdate = vi.fn();
    const onPositionUpdate = vi.fn();

    const { result } = renderHook(() => {
      const svgRef = useRef<SVGSVGElement | null>(null);
      // @ts-expect-error assign mock
      svgRef.current = createSvgRef().current;
      return useGenealogyDrag(svgRef, { x: 0, y: 0 }, onPositionUpdate, onTranslateUpdate);
    });

    act(() => {
      result.current.handleMouseDown({
        button: 0,
        clientX: 10,
        clientY: 20,
        preventDefault: () => {},
        target: { closest: () => null, tagName: 'svg' },
      } as any);
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 20, clientY: 30 }),
      );
    });

    expect(onTranslateUpdate).toHaveBeenCalled();
  });

  it('appelle onPositionUpdate lors du drag d’un nœud', () => {
    const onTranslateUpdate = vi.fn();
    const onPositionUpdate = vi.fn();

    const { result } = renderHook(() => {
      const svgRef = useRef<SVGSVGElement | null>(null);
      // @ts-expect-error assign mock
      svgRef.current = createSvgRef().current;
      return useGenealogyDrag(svgRef, { x: 0, y: 0 }, onPositionUpdate, onTranslateUpdate);
    });

    act(() => {
      result.current.handleNodeMouseDown(
        {
          button: 0,
          stopPropagation: () => {},
          clientX: 10,
          clientY: 10,
        } as any,
        'node1',
        0,
        0,
      );
    });

    act(() => {
      document.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 20, clientY: 20 }),
      );
    });

    expect(onPositionUpdate).toHaveBeenCalledWith('node1', expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }));
  });
});


