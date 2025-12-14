import { motion, AnimatePresence } from 'framer-motion';
import { THEME_CONFIG } from './constants';

type ThemeTransitionOverlayProps = {
  isTransitioning: boolean;
  theme: 'light' | 'dark' | null;
  position?: { x: number; y: number };
};

export function ThemeTransitionOverlay({ 
  isTransitioning, 
  theme, 
  position 
}: ThemeTransitionOverlayProps) {
  if (!isTransitioning || !theme) return null;

  // Utiliser la position réelle du switch ou la position par défaut
  const x = position?.x ?? 20; // 1.25rem = 20px
  const y = position?.y ?? 20;
  
  const background = theme === 'dark' 
    ? 'rgba(0, 0, 0, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)';

  // Calculer le rayon maximum pour couvrir tout l'écran
  const maxRadius = typeof window !== 'undefined' 
    ? Math.max(window.innerWidth, window.innerHeight) * 1.5 
    : 2000;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={theme}
        initial={{ 
          opacity: 0,
          clipPath: `circle(0px at ${x}px ${y}px)`,
        }}
        animate={{ 
          opacity: 1,
          clipPath: `circle(${maxRadius}px at ${x}px ${y}px)`,
        }}
        exit={{ 
          opacity: 0,
          clipPath: `circle(0px at ${x}px ${y}px)`,
        }}
        transition={{ 
          duration: THEME_CONFIG.TRANSITION_DURATION / 1000,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="fixed inset-0 z-[9999] pointer-events-none"
        style={{ background }}
      />
    </AnimatePresence>
  );
}

