/**
 * Hook pour debouncer une valeur
 * Utile pour limiter les appels API lors de la saisie dans un champ de recherche
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Debounce une valeur
 * @param value - La valeur à debouncer
 * @param delay - Le délai en millisecondes (par défaut: 500ms)
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

