/**
 * Hook personnalisé pour gérer l'authentification utilisateur
 * Utilise Supabase Auth pour une authentification sécurisée
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { logAuth } from '@/lib/utils/auth-logger';
import type { User } from '@/types/user';

type UseAuthOptions = {
  redirectIfUnauthenticated?: boolean;
  redirectTo?: string;
};

type UseAuthReturn = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userStatus: string | null;
  logout: () => Promise<void>;
};

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const {
    redirectIfUnauthenticated = false,
    redirectTo = '/',
  } = options;

  const router = useRouter();
  // Mémoriser le client Supabase pour éviter les re-créations
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let finalCheckTimeoutId: NodeJS.Timeout | null = null;
    let hasActiveSession = false; // Flag pour savoir si on a détecté une session active
    let userLoaded = false; // Flag pour savoir si l'utilisateur a été chargé avec succès

    logAuth.hook('useAuth initialisé', { 
      redirectIfUnauthenticated, 
      redirectTo,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
    });

    const loadUser = async () => {
      try {
        logAuth.hook('Début du chargement de l\'utilisateur');
        
        // En production, attendre un peu avant de vérifier la session
        // pour laisser le temps aux cookies de se propager
        const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('vercel');
        if (isProduction) {
          await new Promise(resolve => setTimeout(resolve, 500));
          logAuth.hook('Délai initial pour propagation des cookies en production');
        }
        
        // Timeout de sécurité pour éviter que le chargement reste bloqué
        // Augmenter le timeout en production pour tenir compte de la latence réseau
        // Augmenter aussi le timeout pour laisser le temps à onAuthStateChange de se déclencher
        const initialTimeout = isProduction ? 15000 : 8000; // 15s en prod, 8s en dev
        timeoutId = setTimeout(() => {
          if (mounted) {
            // Si l'utilisateur a déjà été chargé, ne rien faire
            if (userLoaded) {
              return;
            }
            // Si on a détecté une session active, ne pas rediriger immédiatement
            // Laisser plus de temps pour la récupération du profil
            if (hasActiveSession) {
              const secondaryTimeout = isProduction ? 15000 : 10000; // 15s en prod, 10s en dev
              logAuth.warn('HOOK', `Timeout mais session active détectée, attendre encore ${secondaryTimeout / 1000}s...`);
              // Remettre un timeout supplémentaire
              timeoutId = setTimeout(() => {
                if (mounted && !userLoaded) {
                  logAuth.warn('HOOK', 'Timeout final même avec session active');
                  setUser(null);
                  setIsLoading(false);
                  if (redirectIfUnauthenticated) {
                    logAuth.redirect(window.location.pathname, redirectTo, 'Timeout final de chargement');
                    router.push(redirectTo);
                  }
                }
              }, secondaryTimeout);
              return;
            }
            // Ne pas rediriger immédiatement, attendre un peu pour voir si onAuthStateChange se déclenche
            logAuth.warn('HOOK', `Timeout initial (${initialTimeout / 1000}s) - Attente de onAuthStateChange...`);
            // Donner encore 5 secondes pour que onAuthStateChange se déclenche
            finalCheckTimeoutId = setTimeout(() => {
              if (mounted && !userLoaded && !hasActiveSession) {
                logAuth.warn('HOOK', 'Timeout final - Aucune session détectée');
                logger.debug('[useAuth] Timeout final - Aucune session détectée');
                setUser(null);
                setIsLoading(false);
                if (redirectIfUnauthenticated) {
                  logAuth.redirect(window.location.pathname, redirectTo, 'Timeout de chargement');
                  router.push(redirectTo);
                }
              }
            }, 5000);
            return;
          }
        }, initialTimeout);

        // Créer une promesse avec timeout pour getUser()
        // Augmenter le timeout sur Vercel pour tenir compte de la latence réseau
        const timeoutDuration = typeof window !== 'undefined' && window.location.hostname.includes('vercel') 
          ? 8000 
          : 4000;
        
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => {
            reject(new Error('Timeout'));
          }, timeoutDuration)
        );
        
        let authResult;
        try {
          // Utiliser getUser() qui fait une requête HTTP et lit les cookies httpOnly
          // C'est la méthode recommandée avec @supabase/ssr pour les cookies httpOnly
          // Ajouter un petit délai initial pour laisser le temps aux cookies de se propager
          await new Promise(resolve => setTimeout(resolve, 200));
          authResult = await Promise.race([
            authPromise,
            timeoutPromise,
          ]);
        } catch (error) {
          // Si c'est un timeout, ne pas déconnecter immédiatement
          // Il peut s'agir d'un problème réseau temporaire
          if (error instanceof Error && error.message === 'Timeout') {
            logger.debug('[useAuth] Timeout lors de la vérification de session - tentative de récupération...');
            
            // Réessayer plusieurs fois avec des délais progressifs
            // Sur Vercel, les cookies peuvent prendre plus de temps à se propager
            let retryResult = null;
            for (let retry = 0; retry < 3; retry++) {
              try {
                await new Promise(resolve => setTimeout(resolve, 500 * (retry + 1)));
                retryResult = await Promise.race([
                  supabase.auth.getUser(),
                  new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 3000)
                  ),
                ]);
                const { data: { user: retryUser }, error: retryError } = retryResult;
                if (retryUser && !retryError) {
                  logger.debug(`[useAuth] Session trouvée au retry ${retry + 1}`);
                  break;
                }
              } catch (retryErr) {
                logger.debug(`[useAuth] Retry ${retry + 1} échoué:`, retryErr);
                if (retry === 2) {
                  // Dernier retry échoué
                  retryResult = null;
                }
              }
            }
            
            if (retryResult) {
              const { data: { user: retryUser }, error: retryError } = retryResult;
              if (retryError || !retryUser) {
                // Vraiment pas de session
                logger.debug('[useAuth] Aucune session trouvée après retry');
                if (timeoutId) clearTimeout(timeoutId);
                if (finalCheckTimeoutId) clearTimeout(finalCheckTimeoutId);
                if (mounted) {
                  setUser(null);
                  setIsLoading(false);
                  if (redirectIfUnauthenticated) {
                    router.push(redirectTo);
                  }
                }
                return;
              }
              // Session trouvée au retry, continuer normalement
              authResult = retryResult;
            } else {
              // Tous les retries ont échoué
              logger.debug('[useAuth] Aucune session trouvée après tous les retries');
              if (timeoutId) clearTimeout(timeoutId);
              if (finalCheckTimeoutId) clearTimeout(finalCheckTimeoutId);
              if (mounted) {
                setUser(null);
                setIsLoading(false);
                if (redirectIfUnauthenticated) {
                  router.push(redirectTo);
                }
              }
              return;
            }
          } else {
            // Autre erreur, propager
            throw error;
          }
        }
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (finalCheckTimeoutId) {
          clearTimeout(finalCheckTimeoutId);
          finalCheckTimeoutId = null;
        }
        
        const { data: { user: authUser }, error: userError } = authResult;
        
        // Marquer qu'on a une session active dès qu'on a trouvé un utilisateur
        if (authUser && !userError) {
          hasActiveSession = true;
        }
        
        if (userError || !authUser) {
          logAuth.session('Aucune session trouvée', { 
            error: userError?.message,
            redirectIfUnauthenticated,
            redirectTo 
          });
          logger.debug('[useAuth] Aucune session trouvée:', userError?.message);
          logger.debug(`[useAuth] redirectIfUnauthenticated: ${redirectIfUnauthenticated}, redirectTo: ${redirectTo}`);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            if (redirectIfUnauthenticated) {
              logAuth.redirect(window.location.pathname, redirectTo, 'Aucune session trouvée');
              logger.debug(`[useAuth] Redirection vers ${redirectTo} depuis loadUser`);
              router.push(redirectTo);
            }
          }
          return;
        }

        logAuth.session('Utilisateur trouvé', { email: authUser.email, id: authUser.id });
        logger.debug('[useAuth] Utilisateur trouvé dans loadUser:', authUser.email);

        // Récupérer le profil utilisateur via l'API pour éviter les problèmes RLS
        let userData: User | null = null;
        try {
          logAuth.hook('Récupération du profil via API');
          const profileResponse = await fetch('/api/auth/profile');
          if (profileResponse.ok) {
            const { user: profileUser } = await profileResponse.json();
            userData = profileUser;
            if (userData) {
              logAuth.session('Profil récupéré via API', { login: userData.login, status: userData.status });
              logger.debug('[useAuth] Profil récupéré via API:', userData.login, 'Status:', userData.status);
            }
          } else {
            // Fallback: essayer de récupérer directement depuis Supabase
            logger.debug('[useAuth] API profile échoué, tentative directe Supabase');
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              logger.error('[useAuth] Erreur lors de la récupération du profil:', {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
              });
            }

            if (profile) {
              userData = {
                id: profile.id,
                login: profile.login,
                email: profile.email,
                status: profile.status as User['status'],
                description: profile.description || undefined,
                profileImage: profile.profile_image || undefined,
                createdAt: profile.created_at,
                updatedAt: profile.updated_at,
              };
            }
          }
        } catch (fetchError) {
          logger.error('[useAuth] Erreur lors de la récupération du profil via API:', fetchError);
        }

        // Si toujours pas de profil, utiliser les données de base depuis auth
        if (!userData) {
          userData = {
            id: authUser.id,
            login: authUser.email?.split('@')[0] || '',
            email: authUser.email || '',
            status: 'utilisateur',
            description: undefined,
            profileImage: undefined,
            createdAt: authUser.created_at || new Date().toISOString(),
            updatedAt: authUser.updated_at || new Date().toISOString(),
          };
          logger.debug('[useAuth] Utilisation des données de base depuis auth');
        }

        if (mounted) {
          userLoaded = true; // Marquer que l'utilisateur a été chargé
          logAuth.session('Utilisateur chargé avec succès', { 
            login: userData.login, 
            status: userData.status,
            id: userData.id 
          });
          logger.debug('[useAuth] Utilisateur chargé avec succès:', userData.login, 'Status:', userData.status);
          setUser(userData);
          setIsLoading(false);
          // Annuler les timeouts maintenant qu'on a réussi
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (finalCheckTimeoutId) {
            clearTimeout(finalCheckTimeoutId);
            finalCheckTimeoutId = null;
          }
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        if (finalCheckTimeoutId) clearTimeout(finalCheckTimeoutId);
        // Ne logger que les vraies erreurs, pas les timeouts qui sont déjà gérés
        if (error instanceof Error && error.message !== 'Timeout') {
          logger.error('[useAuth] Erreur inattendue lors du chargement de l\'utilisateur:', error);
        } else {
          logger.debug('[useAuth] Timeout ou erreur de réseau (pas de session active)');
        }
        if (mounted) {
          setUser(null);
          setIsLoading(false);
          if (redirectIfUnauthenticated) {
            router.push(redirectTo);
          }
        }
      }
    };

    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logAuth.session(`Événement auth: ${event}`, { 
          hasSession: !!session,
          userEmail: session?.user?.email,
          pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
        });
        logger.debug(`[useAuth] Événement auth: ${event}, session:`, session ? `présente (user: ${session.user?.email})` : 'absente');
        
        if (!mounted) {
          logAuth.hook('Composant démonté, événement ignoré', { event });
          logger.debug('[useAuth] Composant démonté, ignoré');
          return;
        }

        // Si on détecte SIGNED_IN ou INITIAL_SESSION avec une session, marquer qu'il y a une session active
        // et charger directement l'utilisateur pour éviter les redirections prématurées
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          hasActiveSession = true;
          userLoaded = true; // Marquer comme chargé pour éviter les redirections
          logAuth.session('Session active détectée via événement, chargement direct de l\'utilisateur', { event });
          // Annuler les timeouts car on sait qu'il y a une session
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (finalCheckTimeoutId) {
            clearTimeout(finalCheckTimeoutId);
            finalCheckTimeoutId = null;
          }
          
          // Charger directement l'utilisateur depuis la session
          try {
            logger.debug(`[useAuth] Session trouvée pour user: ${session.user.email}, récupération du profil...`);
            // Récupérer le profil utilisateur
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              logger.error('[useAuth] Erreur lors de la récupération du profil:', profileError);
            }

            const userData: User = {
              id: session.user.id,
              login: profile?.login || session.user.email?.split('@')[0] || '',
              email: session.user.email || profile?.email || '',
              status: (profile?.status as User['status']) || 'utilisateur',
              description: profile?.description || null,
              profileImage: profile?.profile_image || null,
              createdAt: profile?.created_at || new Date().toISOString(),
              updatedAt: profile?.updated_at || new Date().toISOString(),
            };

            logAuth.session('Utilisateur chargé directement depuis événement', { 
              login: userData.login, 
              status: userData.status 
            });
            logger.debug(`[useAuth] Utilisateur chargé: ${userData.login}, status: ${userData.status}`);
            if (mounted) {
              setUser(userData);
              setIsLoading(false);
            }
          } catch (error) {
            logAuth.error('HOOK', 'Erreur lors du chargement direct de l\'utilisateur', { 
              error: error instanceof Error ? error.message : 'Erreur inconnue' 
            });
            logger.error('[useAuth] Erreur lors du chargement direct:', error);
            // En cas d'erreur, laisser loadUser() continuer
            userLoaded = false;
          }
          return;
        }

        // Seulement réagir aux événements SIGNED_OUT explicites
        // Ne pas déconnecter pour les autres événements qui peuvent avoir une session null temporairement
        if (event === 'SIGNED_OUT') {
          logAuth.logout('Déconnexion explicite détectée', { 
            pathname: typeof window !== 'undefined' ? window.location.pathname : 'server' 
          });
          logger.debug('[useAuth] Déconnexion explicite détectée');
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            if (redirectIfUnauthenticated) {
              logAuth.redirect(window.location.pathname, redirectTo, 'Déconnexion explicite');
              router.push(redirectTo);
            }
          }
          return;
        }

        if (session?.user) {
          logger.debug(`[useAuth] Session trouvée pour user: ${session.user.email}, récupération du profil...`);
          // Récupérer le profil utilisateur
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            logger.error('[useAuth] Erreur lors de la récupération du profil:', profileError);
          }

          const userData: User = {
            id: session.user.id,
            login: profile?.login || session.user.email?.split('@')[0] || '',
            email: session.user.email || profile?.email || '',
            status: (profile?.status as User['status']) || 'utilisateur',
            description: profile?.description || null,
            profileImage: profile?.profile_image || null,
            createdAt: profile?.created_at || new Date().toISOString(),
            updatedAt: profile?.updated_at || new Date().toISOString(),
          };

          logger.debug(`[useAuth] Utilisateur chargé: ${userData.login}, status: ${userData.status}`);
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (finalCheckTimeoutId) clearTimeout(finalCheckTimeoutId);
      subscription.unsubscribe();
    };
  }, [redirectIfUnauthenticated, redirectTo, router, supabase]);

  const logout = async () => {
    logAuth.logout('Déconnexion initiée', { 
      userId: user?.id,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
    });
    await supabase.auth.signOut();
    setUser(null);
    logAuth.redirect(window.location.pathname, '/', 'Déconnexion manuelle');
    router.push('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userStatus: user?.status || null,
    logout,
  };
}

