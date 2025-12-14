import { useState } from 'react';
import { THEME_CONFIG } from '@/components/theme/constants';

type Theme = 'light' | 'dark';

type UseThemeTransitionOptions = {
  toggleTheme: () => void;
  onTransitionEnd?: () => void;
};

export function useThemeTransition({ toggleTheme, onTransitionEnd }: UseThemeTransitionOptions) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState<Theme | null>(null);

  const startTransition = (newTheme: Theme) => {
    setTransitionTheme(newTheme);
    setIsTransitioning(true);
    
    setTimeout(() => {
      toggleTheme();
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionTheme(null);
        onTransitionEnd?.();
      }, THEME_CONFIG.TRANSITION_CLEANUP_DELAY);
    }, THEME_CONFIG.TRANSITION_DELAY);
  };

  return {
    isTransitioning,
    transitionTheme,
    startTransition,
  };
}

