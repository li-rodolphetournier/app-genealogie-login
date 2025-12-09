'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

type FadeInStaggerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
};

/**
 * Composant pour animer une liste d'éléments avec un effet de cascade
 */
export function FadeInStagger({
  children,
  className = '',
  staggerDelay = 0.1,
  delay = 0,
}: FadeInStaggerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type FadeInStaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function FadeInStaggerItem({ children, className = '' }: FadeInStaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: 'easeOut',
          },
        },
      }}
      className={className}
      style={{ display: 'block' }}
    >
      {children}
    </motion.div>
  );
}

