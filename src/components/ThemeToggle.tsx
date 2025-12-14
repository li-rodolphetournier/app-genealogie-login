'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';
import { useEffect, useState, useRef } from 'react';

const HIDE_DELAY = 3000; // Délai avant de cacher le switch (3 secondes)

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTheme, setTransitionTheme] = useState<'light' | 'dark' | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!mounted) return;

    // Réinitialiser le timer à chaque interaction
    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(true);
      timeoutRef.current = setTimeout(() => {
        if (!isHovered) {
          setIsVisible(false);
        }
      }, HIDE_DELAY);
    };

    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [mounted, isHovered]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, HIDE_DELAY);
  };

  const handleTabClick = () => {
    setIsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      if (!isHovered) {
        setIsVisible(false);
      }
    }, HIDE_DELAY);
  };

  const handleToggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTransitionTheme(newTheme);
    setIsTransitioning(true);
    
    // Animation de transition
    setTimeout(() => {
      toggleTheme();
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionTheme(null);
      }, 200);
    }, 100);
    
    handleTabClick();
  };

  if (!mounted) {
    // Éviter le flash de contenu non stylé (FOUC)
    return (
      <div className="w-14 h-8 rounded-full bg-gray-200 flex items-center p-1">
        <div className="w-6 h-6 rounded-full bg-white shadow-sm" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <>
      {/* Overlay de transition pour le changement de thème */}
      <AnimatePresence mode="wait">
        {isTransitioning && transitionTheme && (
          <motion.div
            key={transitionTheme}
            initial={{ 
              opacity: 0,
              clipPath: 'circle(0% at 1.25rem 1.25rem)',
            }}
            animate={{ 
              opacity: 1,
              clipPath: 'circle(150% at 1.25rem 1.25rem)',
            }}
            exit={{ 
              opacity: 0,
              clipPath: 'circle(0% at 1.25rem 1.25rem)',
            }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1],
            }}
            className="fixed inset-0 z-[9999] pointer-events-none"
            style={{
              background: transitionTheme === 'dark' 
                ? 'rgba(0, 0, 0, 0.8)' 
                : 'rgba(255, 255, 255, 0.8)',
            }}
          />
        )}
      </AnimatePresence>

      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Languette visible quand le switch est caché */}
        <AnimatePresence>
        {!isVisible && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 z-10"
            onClick={handleTabClick}
            onMouseEnter={handleMouseEnter}
          >
            <div className="w-8 h-16 rounded-r-full bg-gray-200 dark:bg-gray-700 border-l-2 border-gray-300 dark:border-gray-600 shadow-lg cursor-pointer flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
              <motion.div
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? (
                  <svg
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>

        {/* Switch principal */}
        <AnimatePresence>
        {isVisible && (
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            onClick={handleToggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              isDark ? 'bg-blue-600' : 'bg-gray-300'
            }`}
            aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
              animate={{
                x: isDark ? 24 : 0,
              }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
            >
              <motion.div
                key={theme}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {isDark ? (
                  <svg
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.div>
            </motion.div>
          </motion.button>
        )}
        </AnimatePresence>
      </div>
    </>
  );
}

