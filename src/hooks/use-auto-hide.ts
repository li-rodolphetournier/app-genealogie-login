import { useEffect, useState, useRef } from 'react';

type UseAutoHideOptions = {
  delay: number;
  initialVisible?: boolean;
};

export function useAutoHide({ delay, initialVisible = true }: UseAutoHideOptions) {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const clearTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const show = () => {
    clearTimeout();
    setIsVisible(true);
  };

  const hide = () => {
    clearTimeout();
    timeoutRef.current = window.setTimeout(() => {
      if (!isHovered) {
        setIsVisible(false);
      }
    }, delay);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    show();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    hide();
  };

  useEffect(() => {
    if (initialVisible) {
      hide();
    }

    return () => {
      clearTimeout();
    };
  }, [isHovered]);

  return {
    isVisible,
    show,
    hide,
    handleMouseEnter,
    handleMouseLeave,
  };
}

