import { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeIcon } from './ThemeIcon';
import { THEME_ANIMATIONS } from './constants';

type ThemeSwitchProps = {
  isVisible: boolean;
  isDark: boolean;
  onToggle: () => void;
};

export const ThemeSwitch = forwardRef<HTMLButtonElement, ThemeSwitchProps>(
  ({ isVisible, isDark, onToggle }, ref) => {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            {...THEME_ANIMATIONS.slideIn}
            className="relative"
          >
            <button
              ref={ref}
              onClick={onToggle}
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isDark ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center"
                animate={{
                  x: isDark ? 24 : 0,
                }}
                transition={THEME_ANIMATIONS.toggle}
              >
                <ThemeIcon isDark={isDark} />
              </motion.div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

ThemeSwitch.displayName = 'ThemeSwitch';

