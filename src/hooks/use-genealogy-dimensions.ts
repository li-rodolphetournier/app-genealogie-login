import { useState, useEffect } from 'react';

export function useGenealogyDimensions(isMenuOpen: boolean, headerHeight: number = 64) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth - (isMenuOpen ? 384 : 0),
        height: window.innerHeight - headerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isMenuOpen, headerHeight]);

  return dimensions;
}

