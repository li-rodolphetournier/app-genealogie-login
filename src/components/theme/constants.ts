export const THEME_CONFIG = {
  HIDE_DELAY: 3000, // Délai avant de cacher le switch (ms)
  TRANSITION_DURATION: 400, // Durée de la transition (ms)
  TRANSITION_DELAY: 100, // Délai avant d'appliquer le thème (ms)
  TRANSITION_CLEANUP_DELAY: 200, // Délai avant de nettoyer la transition (ms)
  ANIMATION_DURATION: 0.3, // Durée des animations (s)
  SWITCH_POSITION: { x: '1.25rem', y: '1.25rem' }, // Position du switch pour l'animation
} as const;

export const THEME_ANIMATIONS = {
  slideIn: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.3, ease: 'easeInOut' as const },
  },
  icon: {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 20,
    },
  },
  toggle: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
} as const;

