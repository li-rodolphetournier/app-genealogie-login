/**
 * Hook pour gérer le localStorage de manière sécurisée
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * Hook pour gérer le localStorage avec synchronisation entre onglets
 * @param key - La clé du localStorage
 * @param initialValue - La valeur initiale si la clé n'existe pas
 * @returns [storedValue, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // État pour stocker la valeur
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erreur lors de la lecture de localStorage pour "${key}":`, error);
      return initialValue;
    }
  });

  // Fonction pour mettre à jour la valeur
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Permettre à value d'être une fonction pour avoir la même API que useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        setStoredValue(valueToStore);
        
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          
          // Déclencher un événement personnalisé pour synchroniser entre onglets
          window.dispatchEvent(new Event('local-storage'));
        }
      } catch (error) {
        console.error(`Erreur lors de l'écriture dans localStorage pour "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Fonction pour supprimer la valeur
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        window.dispatchEvent(new Event('local-storage'));
      }
    } catch (error) {
      console.error(`Erreur lors de la suppression de localStorage pour "${key}":`, error);
    }
  }, [key, initialValue]);

  // Écouter les changements dans d'autres onglets
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorageChange = (e: StorageEvent | Event) => {
      if (e instanceof StorageEvent && e.key !== key) {
        return;
      }

      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.error(`Erreur lors de la synchronisation de localStorage pour "${key}":`, error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

