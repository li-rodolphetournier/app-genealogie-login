'use client';

import { useState, useRef } from 'react';
import { useTheme } from '@/hooks/use-theme';
import { useAutoHide } from '@/hooks/use-auto-hide';
import { ThemeTab } from './ThemeTab';
import { ThemeSwitch } from './ThemeSwitch';
import { ThemeTransitionOverlay } from './ThemeTransitionOverlay';
import { THEME_CONFIG } from './constants';

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const { isVisible, show, handleMouseEnter, handleMouseLeave } = useAutoHide({
    delay: THEME_CONFIG.HIDE_DELAY,
  });
  
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState<'light' | 'dark' | null>(null);
  const [transitionPosition, setTransitionPosition] = useState<{ x: number; y: number } | undefined>();
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    // Obtenir la position réelle du switch pour l'animation
    let position: { x: number; y: number } | undefined;
    if (switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      setTransitionPosition(position);
    }
    
    // Démarrer la transition
    setTransitionTheme(newTheme);
    setIsTransitioning(true);
    
    // Changer le thème après un court délai pour laisser l'animation démarrer
    setTimeout(() => {
      toggleTheme();
      
      // Terminer la transition après la durée de l'animation
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionTheme(null);
        setTransitionPosition(undefined);
      }, THEME_CONFIG.TRANSITION_DURATION);
    }, 50);
    
    show();
  };

  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-gray-200 flex items-center p-1">
        <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <>
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <ThemeTab
          isVisible={isVisible}
          isDark={isDark}
          onShow={show}
          onMouseEnter={handleMouseEnter}
        />
        <ThemeSwitch
          ref={switchRef}
          isVisible={isVisible}
          isDark={isDark}
          onToggle={handleToggleTheme}
        />
      </div>
      <ThemeTransitionOverlay
        isTransitioning={isTransitioning}
        theme={transitionTheme}
        position={transitionPosition}
      />
    </>
  );
}

