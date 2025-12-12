'use client';

import { useEffect, useState, useCallback } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './use-auth';
import type { ComponentType } from 'react';

type UseSessionTimeoutOptions = {
  /** Durée d'inactivité avant avertissement (en ms). Par défaut: 13 minutes */
  warningTimeout?: number;
  /** Durée d'inactivité avant déconnexion (en ms). Par défaut: 15 minutes */
  logoutTimeout?: number;
  /** Durée du compte à rebours avant déconnexion automatique (en secondes). Par défaut: 120 secondes (2 minutes) */
  countdownDuration?: number;
  /** Activer la détection d'inactivité. Par défaut: true */
  enabled?: boolean;
};

/**
 * Hook pour gérer le timeout de session et l'inactivité utilisateur
 * 
 * Fonctionnalités :
 * - Détecte l'inactivité utilisateur (pas de mouvement, clic, scroll, etc.)
 * - Affiche un avertissement avant déconnexion
 * - Vérifie l'expiration de la session Supabase
 * - Déconnecte automatiquement après inactivité ou expiration
 */
export function useSessionTimeout(options: UseSessionTimeoutOptions = {}) {
  const {
    warningTimeout = 13 * 60 * 1000, // 13 minutes
    logoutTimeout = 15 * 60 * 1000, // 15 minutes
    countdownDuration = 120, // 2 minutes
    enabled = true,
  } = options;

  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(countdownDuration);
  const supabase = createClient();

  // Vérifier l'expiration de la session Supabase
  const checkSessionExpiry = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Session expirée ou invalide
        logout();
        return;
      }

      // Vérifier l'expiration du token JWT
      // Supabase stocke expires_at en secondes (timestamp Unix)
      if (session.expires_at) {
        const expiresAt = new Date(session.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        // Si le token expire dans moins de 2 minutes, avertir
        if (timeUntilExpiry < 2 * 60 * 1000 && timeUntilExpiry > 0) {
          const remainingSeconds = Math.floor(timeUntilExpiry / 1000);
          setSecondsRemaining(Math.max(remainingSeconds, 10)); // Minimum 10 secondes
          setShowWarning(true);
        } else if (timeUntilExpiry <= 0) {
          // Token expiré, déconnecter immédiatement
          logout();
        }
      }
    } catch (error) {
      console.error('[useSessionTimeout] Erreur lors de la vérification de session:', error);
    }
  }, [user, enabled, supabase, logout]);

  // Vérifier l'expiration de la session périodiquement
  useEffect(() => {
    if (!user || !enabled) return;

    // Vérifier immédiatement
    checkSessionExpiry();

    // Vérifier toutes les minutes
    const interval = setInterval(checkSessionExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [user, enabled, checkSessionExpiry]);

  // Gérer l'inactivité utilisateur
  const handleOnIdle = useCallback(() => {
    if (!user || !enabled) return;
    
    setSecondsRemaining(countdownDuration);
    setShowWarning(true);
  }, [user, enabled, countdownDuration]);

  const handleOnActive = useCallback(() => {
    setShowWarning(false);
    setSecondsRemaining(countdownDuration);
  }, [countdownDuration]);

  const handleOnAction = useCallback(() => {
    // Si l'utilisateur fait une action, cacher l'avertissement
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(countdownDuration);
    }
  }, [showWarning, countdownDuration]);

  // Configurer le timer d'inactivité
  useIdleTimer({
    timeout: warningTimeout,
    onIdle: handleOnIdle,
    onActive: handleOnActive,
    onAction: handleOnAction,
    debounce: 500,
    enabled: enabled && !!user,
  });

  const handleStayActive = useCallback(() => {
    setShowWarning(false);
    setSecondsRemaining(countdownDuration);
    // Rafraîchir la session si possible
    supabase.auth.refreshSession().catch(console.error);
  }, [countdownDuration, supabase]);

  const handleLogout = useCallback(() => {
    setShowWarning(false);
    logout();
  }, [logout]);

  return {
    showWarning,
    secondsRemaining,
    handleStayActive,
    handleLogout,
  };
}

