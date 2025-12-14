import { motion, AnimatePresence } from 'framer-motion';
import { ThemeIcon } from './ThemeIcon';
import { THEME_ANIMATIONS } from './constants';

type ThemeTabProps = {
  isVisible: boolean;
  isDark: boolean;
  onShow: () => void;
  onMouseEnter: () => void;
};

export function ThemeTab({ isVisible, isDark, onShow, onMouseEnter }: ThemeTabProps) {
  return (
    <AnimatePresence>
      {!isVisible && (
        <motion.div
          {...THEME_ANIMATIONS.slideIn}
          className="fixed left-0 top-0 z-10"
          onClick={onShow}
          onMouseEnter={onMouseEnter}
        >
          <div className="w-8 h-16 rounded-r-full bg-gray-200 dark:bg-gray-700 border-l-2 border-gray-300 dark:border-gray-600 shadow-lg cursor-pointer flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            <motion.div
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ThemeIcon isDark={isDark} />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

