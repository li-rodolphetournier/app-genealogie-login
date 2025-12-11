'use client';

import { useState, useEffect } from 'react';
import { AuthDebugPanel } from './AuthDebugPanel';

export function AuthDebugPanelWrapper() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Vérifier uniquement côté client après le montage pour éviter l'erreur d'hydratation
    const isDev = process.env.NODE_ENV === 'development';
    const hasDebugParam = typeof window !== 'undefined' && window.location.search.includes('debug=auth');
    const hasLocalStorageFlag = typeof window !== 'undefined' && localStorage.getItem('auth-debug') === 'true';

    if (isDev || hasDebugParam || hasLocalStorageFlag) {
      setShouldShow(true);
    }
  }, []);

  // Ne rien rendre côté serveur ou avant la vérification (évite l'erreur d'hydratation)
  if (!shouldShow) {
    return null;
  }

  return <AuthDebugPanel />;
}

