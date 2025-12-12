'use client';

import { useState, useEffect } from 'react';
import { isAuthDebugEnabled } from '../flags';
import { AuthDebugPanel } from './AuthDebugPanel';

/**
 * Wrapper conditionnel pour le panneau de debug
 * Ne s'affiche que si la feature est activée
 */
export function AuthDebugPanelWrapper() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Vérifier uniquement côté client après le montage pour éviter l'erreur d'hydratation
    const isEnabled = isAuthDebugEnabled();
    const hasDebugParam = typeof window !== 'undefined' && window.location.search.includes('debug=auth');
    const hasLocalStorageFlag = typeof window !== 'undefined' && localStorage.getItem('auth-debug') === 'true';

    if (isEnabled || hasDebugParam || hasLocalStorageFlag) {
      setShouldShow(true);
    }
  }, []);

  // Ne rien rendre si la feature est désactivée
  if (!shouldShow) {
    return null;
  }

  return <AuthDebugPanel />;
}

