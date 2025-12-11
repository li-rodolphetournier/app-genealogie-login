import { useState, useEffect, useRef, useCallback } from 'react';

type Position = { x: number; y: number };

export function useGenealogyDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
  translate: { x: number; y: number },
  onPositionUpdate: (nodeId: string, position: Position) => void,
  onTranslateUpdate: (translate: { x: number; y: number }) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragNodeStart, setDragNodeStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 0) {
      const target = e.target as HTMLElement;
      if (target.closest('foreignObject') || target.tagName === 'foreignObject') {
        return;
      }
      
      setIsDragging(true);
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        setDragStart({
          x: e.clientX - svgRect.left - translate.x,
          y: e.clientY - svgRect.top - translate.y
        });
      }
      e.preventDefault();
    }
  }, [svgRef, translate]);

  const handleNodeMouseDown = useCallback((
    e: React.MouseEvent,
    nodeId: string,
    nodeX: number,
    nodeY: number
  ) => {
    e.stopPropagation();
    if (e.button === 0 && svgRef.current) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const svgX = e.clientX - svgRect.left - translate.x;
      const svgY = e.clientY - svgRect.top - translate.y;
      
      setDraggedNodeId(nodeId);
      setDragNodeStart({
        x: svgX,
        y: svgY,
        nodeX,
        nodeY
      });
    }
  }, [svgRef, translate]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedNodeId && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgX = e.clientX - svgRect.left - translate.x;
        const svgY = e.clientY - svgRect.top - translate.y;
        
        const newX = dragNodeStart.nodeX + (svgX - dragNodeStart.x);
        const newY = dragNodeStart.nodeY + (svgY - dragNodeStart.y);
        
        onPositionUpdate(draggedNodeId, { x: newX, y: newY });
      } else if (isDragging && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        onTranslateUpdate({
          x: e.clientX - svgRect.left - dragStart.x,
          y: e.clientY - svgRect.top - dragStart.y
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (draggedNodeId) {
        setDraggedNodeId(null);
      }
      setIsDragging(false);
    };

    if (isDragging || draggedNodeId) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, draggedNodeId, dragNodeStart, translate, svgRef, onPositionUpdate, onTranslateUpdate]);

  return {
    isDragging,
    draggedNodeId,
    handleMouseDown,
    handleNodeMouseDown
  };
}

