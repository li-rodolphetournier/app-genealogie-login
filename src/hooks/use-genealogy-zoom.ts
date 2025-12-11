import { useState, useCallback } from 'react';

export function useGenealogyZoom(initialZoom: number = 1.0, minZoom: number = 0.1, maxZoom: number = 2.0) {
  const [zoomLevel, setZoomLevel] = useState(initialZoom);

  const zoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(maxZoom, prev + 0.1));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(minZoom, prev - 0.1));
  }, [minZoom]);

  const setZoom = useCallback((zoom: number) => {
    setZoomLevel(Math.max(minZoom, Math.min(maxZoom, zoom)));
  }, [minZoom, maxZoom]);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    setZoom
  };
}

