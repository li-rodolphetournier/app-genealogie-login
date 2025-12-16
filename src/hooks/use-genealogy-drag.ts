import { useState, useEffect, useRef, useCallback } from 'react';

type Position = { x: number; y: number };

const LONG_PRESS_DURATION = 300; // ms

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
  const [isLongPressing, setIsLongPressing] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType !== 'touch' && e.pointerType !== 'mouse') return;
    
    const target = e.target as HTMLElement;
    if (target.closest('foreignObject') || target.tagName === 'foreignObject') {
      return;
    }
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const startX = e.clientX - svgRect.left - translate.x;
    const startY = e.clientY - svgRect.top - translate.y;
    
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    hasMovedRef.current = false;
    
    // Sur desktop (mouse), démarrer le drag immédiatement
    if (e.pointerType === 'mouse') {
      setIsDragging(true);
      setDragStart({ x: startX, y: startY });
    } else {
      // Sur mobile (touch), attendre le long-press
      longPressTimerRef.current = setTimeout(() => {
        setIsLongPressing(true);
        setIsDragging(true);
        setDragStart({ x: startX, y: startY });
      }, LONG_PRESS_DURATION);
    }
  }, [svgRef, translate]);

  const handleNodePointerDown = useCallback((
    e: React.PointerEvent,
    nodeId: string,
    nodeX: number,
    nodeY: number
  ) => {
    e.stopPropagation();
    if ((e.button !== 0 && e.pointerType === 'mouse') || !svgRef.current) return;
    
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const svgRect = svgRef.current.getBoundingClientRect();
    const svgX = e.clientX - svgRect.left - translate.x;
    const svgY = e.clientY - svgRect.top - translate.y;
    
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    hasMovedRef.current = false;
    
    // Pour les nœuds, on démarre directement le drag (pas de long-press)
    setDraggedNodeId(nodeId);
    setDragNodeStart({
      x: svgX,
      y: svgY,
      nodeX,
      nodeY
    });
  }, [svgRef, translate]);

  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      // Détecter si le pointeur a bougé
      if (pointerStartRef.current) {
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        if (dx > 5 || dy > 5) {
          hasMovedRef.current = true;
          // Si on bouge avant le long-press, annuler le timer
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        }
      }

      if (draggedNodeId && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const svgX = e.clientX - svgRect.left - translate.x;
        const svgY = e.clientY - svgRect.top - translate.y;
        
        const newX = dragNodeStart.nodeX + (svgX - dragNodeStart.x);
        const newY = dragNodeStart.nodeY + (svgY - dragNodeStart.y);
        
        onPositionUpdate(draggedNodeId, { x: newX, y: newY });
      } else if ((isDragging || isLongPressing) && svgRef.current) {
        const svgRect = svgRef.current.getBoundingClientRect();
        onTranslateUpdate({
          x: e.clientX - svgRect.left - dragStart.x,
          y: e.clientY - svgRect.top - dragStart.y
        });
      }
    };

    const handleGlobalPointerUp = (e: PointerEvent) => {
      // Annuler le timer si le pointeur est relâché avant le long-press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (draggedNodeId) {
        setDraggedNodeId(null);
      }
      setIsDragging(false);
      setIsLongPressing(false);
      pointerStartRef.current = null;
      hasMovedRef.current = false;
    };

    if (isDragging || draggedNodeId || isLongPressing) {
      document.addEventListener('pointermove', handleGlobalPointerMove);
      document.addEventListener('pointerup', handleGlobalPointerUp);
      document.addEventListener('pointercancel', handleGlobalPointerUp);
      return () => {
        document.removeEventListener('pointermove', handleGlobalPointerMove);
        document.removeEventListener('pointerup', handleGlobalPointerUp);
        document.removeEventListener('pointercancel', handleGlobalPointerUp);
      };
    }
  }, [isDragging, dragStart, draggedNodeId, dragNodeStart, translate, svgRef, onPositionUpdate, onTranslateUpdate, isLongPressing]);

  // Nettoyage du timer au démontage
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    draggedNodeId,
    handlePointerDown,
    handleNodePointerDown
  };
}

