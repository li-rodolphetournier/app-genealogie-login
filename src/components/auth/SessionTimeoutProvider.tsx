'use client';

import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { IdleWarning } from './IdleWarning';

/**
 * Provider pour gérer le timeout de session et l'inactivité utilisateur
 * 
 * Ce composant doit être utilisé dans le layout principal pour activer
 * la gestion automatique du timeout de session.
 */
export function SessionTimeoutProvider() {
  const { showWarning, secondsRemaining, handleStayActive, handleLogout } = useSessionTimeout({
    warningTimeout: 13 * 60 * 1000, // 13 minutes d'inactivité avant avertissement
    logoutTimeout: 15 * 60 * 1000, // 15 minutes d'inactivité avant déconnexion
    countdownDuration: 120, // 2 minutes de compte à rebours
    enabled: true,
  });

  if (!showWarning) return null;

  return (
    <IdleWarning
      onStayActive={handleStayActive}
      onLogout={handleLogout}
      secondsRemaining={secondsRemaining}
    />
  );
}

