/**
 * Hook personnalisé pour gérer l'authentification utilisateur
 * Utilise Supabase Auth pour une authentification sécurisée
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { logAuth } from '@/lib/features/auth-debug';
import type { User } from '@/types/user';
import { isMockModeEnabled, createMockUser } from '@/lib/features/mock-auth';

// Cache global partagé entre toutes les instances du hook pour éviter les chargements multiples
const globalAuthCache = {
  profileLoadingInProgress: false,
  lastLoadedUserId: null as string | null,
  lastLoadedUser: null as User | null,
  loadingPromise: null as Promise<User | null> | null,
};

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
    let profileLoadingInProgress = false; // Flag pour éviter les chargements multiples du profil

    logAuth.hook('useAuth initialisé', { 
      redirectIfUnauthenticated, 
      redirectTo,
      pathname: typeof window !== 'undefined' ? window.location.pathname : 'server'
    });

    // Vérifier le mode mock (uniquement en développement)
    // Vérifier d'abord le paramètre URL
    let mockId: string | null = null;
    if (typeof window !== 'undefined' && isMockModeEnabled()) {
      const urlParams = new URLSearchParams(window.location.search);
      mockId = urlParams.get('mock');
      
      if (mockId) {
        const mockUser = createMockUser(mockId);
        logAuth.hook('Mode mock activé depuis URL', { mockId, user: mockUser.login });
        logger.debug('[useAuth] Mode mock activé avec ID:', mockId);
        
        if (mounted) {
          setUser(mockUser);
          setIsLoading(false);
        }
        
        // Ne pas continuer avec le chargement normal ni s'abonner à onAuthStateChange si on est en mode mock
        // Retourner une fonction de nettoyage vide
        return () => {
          mounted = false;
        };
      }
      
      // Si pas de paramètre dans l'URL, vérifier via l'API profile (qui gère le cookie httpOnly)
      // Faire une vérification rapide pour voir si on est en mode mock
      const checkMockViaAPI = async () => {
        try {
          const profileResponse = await fetch('/api/auth/profile');
          if (profileResponse.ok) {
            const { user: profileUser } = await profileResponse.json();
            // Vérifier si c'est un utilisateur mock (ID commence par "mock-")
            if (profileUser && profileUser.id && profileUser.id.startsWith('mock-')) {
              logAuth.hook('Mode mock détecté via API', { userId: profileUser.id, user: profileUser.login });
              logger.debug('[useAuth] Mode mock détecté via API:', profileUser.id);
              
              if (mounted) {
                setUser(profileUser);
                setIsLoading(false);
              }
              
              // Ne pas continuer avec le chargement normal
              return true;
            }
          }
        } catch (error) {
          // Erreur silencieuse, continuer avec le chargement normal
          logger.debug('[useAuth] Erreur lors de la vérification mock via API:', error);
        }
        return false;
      };
      
      // Vérifier rapidement le mock via l'API avant de continuer
      checkMockViaAPI().then(isMock => {
        if (isMock && mounted) {
          // Si on est en mode mock, ne pas continuer
          return;
        }
      });
    }

    const loadUser = async () => {
      try {
        logAuth.hook('Début du chargement de l\'utilisateur');
        
        // Déterminer si on est en production
        const isProduction = typeof window !== 'undefined' && 
          (window.location.hostname.includes('vercel') || 
           window.location.hostname.includes('netlify') ||
           process.env.NODE_ENV === 'production');
        
        // Détecter si on est sur mobile (pour augmenter les délais)
        const isMobile = typeof window !== 'undefined' && 
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Délai pour attendre que onAuthStateChange ait eu le temps de se déclencher
        // Sur mobile, augmenter le délai car les cookies peuvent prendre plus de temps
        const waitForInitialSession = isMobile ? 1000 : (isProduction ? 500 : 200);
        
        // Vérifier si on vient juste de se connecter (éviter la boucle)
        // Si on a un paramètre dans l'URL ou dans sessionStorage, on vient de se connecter
        const justLoggedIn = typeof window !== 'undefined' && 
          (sessionStorage.getItem('just-logged-in') === 'true' || 
           window.location.search.includes('logged-in=true'));
        
        if (justLoggedIn) {
          logAuth.hook('Connexion récente détectée, délai supplémentaire pour propagation des cookies');
          // Sur mobile, attendre plus longtemps après une connexion
          await new Promise(resolve => setTimeout(resolve, isMobile ? 2000 : 1500));
          // Nettoyer le flag
          sessionStorage.removeItem('just-logged-in');
        }
        
        // Attendre que onAuthStateChange ait eu le temps de se déclencher
        // Si INITIAL_SESSION s'est déclenché, onAuthStateChange aura déjà chargé l'utilisateur
        await new Promise(resolve => setTimeout(resolve, waitForInitialSession));
        
        // Si l'utilisateur a déjà été chargé par onAuthStateChange, ne rien faire
        if (userLoaded || hasActiveSession) {
          logAuth.hook('Utilisateur déjà chargé par onAuthStateChange, skip getUser()');
          logger.debug('[useAuth] Utilisateur déjà chargé par onAuthStateChange, skip getUser()');
          // S'assurer que isLoading est à false si l'utilisateur est déjà chargé
          // Même si user n'est pas encore dans le state, onAuthStateChange va le charger
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }
        
        // En production ou sur mobile, attendre un peu plus avant de vérifier la session
        // pour laisser le temps aux cookies de se propager
        if (isProduction || isMobile) {
          const cookieDelay = isMobile ? 1000 : 500;
          await new Promise(resolve => setTimeout(resolve, cookieDelay));
          logAuth.hook(`Délai initial pour propagation des cookies (${isMobile ? 'mobile' : 'production'})`);
        }
        
        // Timeout de sécurité pour éviter que le chargement reste bloqué
        // Augmenter le timeout en production et sur mobile pour tenir compte de la latence réseau
        // Augmenter aussi le timeout pour laisser le temps à onAuthStateChange de se déclencher
        const initialTimeout = isMobile ? 20000 : (isProduction ? 15000 : 8000); // 20s sur mobile, 15s en prod, 8s en dev
        timeoutId = setTimeout(() => {
          if (mounted) {
            // Si l'utilisateur a déjà été chargé, ne rien faire
            if (userLoaded) {
              return;
            }
            // Si on a détecté une session active, ne pas rediriger immédiatement
            // Laisser plus de temps pour la récupération du profil
            if (hasActiveSession) {
              const secondaryTimeout = isMobile ? 20000 : (isProduction ? 15000 : 10000); // 20s sur mobile, 15s en prod, 10s en dev
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
        // Augmenter le timeout en production et sur mobile pour tenir compte de la latence réseau
        const timeoutDuration = isMobile ? 15000 : (isProduction ? 10000 : 5000); // 15s sur mobile, 10s en prod, 5s en dev
        
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
          logAuth.session('Session active détectée via événement, chargement direct de l\'utilisateur', { 
            event,
            userId: session.user.id,
            email: session.user.email
          });
          // Annuler les timeouts car on sait qu'il y a une session
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (finalCheckTimeoutId) {
            clearTimeout(finalCheckTimeoutId);
            finalCheckTimeoutId = null;
          }
          
          // Vérifier si l'utilisateur est déjà chargé dans le cache global ou local
          const cachedUser = globalAuthCache.lastLoadedUserId === session.user.id 
            ? globalAuthCache.lastLoadedUser 
            : null;
          
          if (mounted && (user || cachedUser)) {
            const currentUser = user || cachedUser;
            if (currentUser && currentUser.id === session.user.id) {
              // L'utilisateur est déjà chargé, vérifier si on a besoin de mettre à jour
              const needsUpdate = !currentUser.login || currentUser.status === 'utilisateur' || !currentUser.email;
              if (!needsUpdate) {
                // Si on a un utilisateur en cache mais pas dans le state local, l'utiliser
                if (!user && cachedUser) {
                  setUser(cachedUser);
                }
                logAuth.hook('Utilisateur déjà chargé (cache ou local), skip mise à jour', { 
                  userId: currentUser.id,
                  login: currentUser.login,
                  fromCache: !!cachedUser && !user
                });
                setIsLoading(false);
                return;
              }
            }
          }
          
          // Créer un utilisateur minimal immédiatement pour éviter que la page reste vide
          // Seulement si l'utilisateur n'est pas déjà chargé ou si les données sont incomplètes
          if (mounted && (!user || user.id !== session.user.id || !user.login) && !cachedUser) {
            const immediateUser: User = {
              id: session.user.id,
              login: session.user.email?.split('@')[0] || '',
              email: session.user.email || '',
              status: 'utilisateur',
              description: undefined,
              profileImage: undefined,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setUser(immediateUser);
            setIsLoading(false);
            logAuth.hook('Utilisateur minimal créé immédiatement depuis session', { 
              userId: immediateUser.id,
              email: immediateUser.email
            });
          } else if (mounted && cachedUser) {
            // Utiliser l'utilisateur du cache
            setUser(cachedUser);
            setIsLoading(false);
            logAuth.hook('Utilisateur chargé depuis cache global', { 
              userId: cachedUser.id,
              login: cachedUser.login
            });
            return; // Pas besoin de charger le profil, il est déjà en cache
          } else if (mounted) {
            setIsLoading(false);
          }
          
          // Charger le profil complet en arrière-plan (ne bloque pas l'affichage)
          // Utiliser le cache global pour éviter les chargements multiples entre instances
          const needsProfileLoad = mounted && (!user || !user.login || user.status === 'utilisateur') && 
                                   !globalAuthCache.profileLoadingInProgress &&
                                   globalAuthCache.lastLoadedUserId !== session.user.id;
          
          if (needsProfileLoad) {
            globalAuthCache.profileLoadingInProgress = true; // Marquer comme en cours globalement
            globalAuthCache.loadingPromise = (async () => {
            try {
            logger.debug(`[useAuth] Session trouvée pour user: ${session.user.email}, récupération du profil...`);
            logAuth.hook('Tentative de récupération du profil depuis users', { userId: session.user.id });
            
            // Récupérer le profil utilisateur avec timeout
            const profilePromise = supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            const timeoutPromise = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout récupération profil')), 5000)
            );
            
            let profileResult;
            try {
              profileResult = await Promise.race([profilePromise, timeoutPromise]);
            } catch (profileErr) {
              // Si timeout ou erreur, continuer avec un profil vide
              logAuth.warn('HOOK', 'Erreur ou timeout lors de la récupération du profil', { 
                error: profileErr instanceof Error ? profileErr.message : 'Erreur inconnue' 
              });
              profileResult = { data: null, error: profileErr instanceof Error ? { code: 'TIMEOUT', message: profileErr.message } : null };
            }

            const { data: profile, error: profileError } = profileResult || { data: null, error: null };

            if (profileError && profileError.code !== 'PGRST116' && profileError.code !== 'TIMEOUT') {
              logger.error('[useAuth] Erreur lors de la récupération du profil:', profileError);
              logAuth.warn('HOOK', 'Erreur lors de la récupération du profil (continuation avec données minimales)', { 
                error: profileError.message 
              });
            }

            const userData: User = {
              id: session.user.id,
              login: profile?.login || session.user.email?.split('@')[0] || '',
              email: session.user.email || profile?.email || '',
              status: (profile?.status as User['status']) || 'utilisateur',
              description: profile?.description || undefined,
              profileImage: profile?.profile_image || undefined,
              createdAt: profile?.created_at || new Date().toISOString(),
              updatedAt: profile?.updated_at || new Date().toISOString(),
            };

            logAuth.session('Utilisateur chargé directement depuis événement', { 
              login: userData.login, 
              status: userData.status,
              hasProfile: !!profile
            });
            logger.debug(`[useAuth] Utilisateur chargé: ${userData.login}, status: ${userData.status}`);
            
            // Mettre à jour le cache global
            globalAuthCache.lastLoadedUserId = userData.id;
            globalAuthCache.lastLoadedUser = userData;
            
            if (mounted) {
              // Mettre à jour user avec le profil complet seulement si nécessaire
              // Éviter les mises à jour inutiles qui causent des re-renders
              const currentUser = user;
              const needsUpdate = !currentUser || 
                                 currentUser.id !== userData.id || 
                                 currentUser.login !== userData.login || 
                                 currentUser.status !== userData.status ||
                                 currentUser.email !== userData.email;
              
              if (needsUpdate) {
                setUser(userData);
                logAuth.hook('Profil complet chargé et state mis à jour', { 
                  userId: userData.id, 
                  login: userData.login,
                  status: userData.status
                });
              } else {
                logAuth.hook('Profil déjà à jour, skip mise à jour', { 
                  userId: userData.id
                });
              }
            } else {
              logAuth.warn('HOOK', 'Composant démonté, state non mis à jour', { userId: userData.id });
            }
            
            return userData;
          } catch (error) {
            logAuth.error('HOOK', 'Erreur lors du chargement direct de l\'utilisateur', { 
              error: error instanceof Error ? error.message : 'Erreur inconnue',
              stack: error instanceof Error ? error.stack : undefined
            });
            logger.error('[useAuth] Erreur lors du chargement direct:', error);
            // En cas d'erreur, créer un utilisateur minimal depuis la session
            if (mounted && session?.user) {
              const fallbackUser: User = {
                id: session.user.id,
                login: session.user.email?.split('@')[0] || '',
                email: session.user.email || '',
                status: 'utilisateur',
                description: undefined,
                profileImage: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setUser(fallbackUser);
              setIsLoading(false);
              logAuth.warn('HOOK', 'Utilisateur créé depuis session (profil non trouvé ou erreur)', { 
                userId: fallbackUser.id,
                email: fallbackUser.email
              });
            }
            // Ne pas réinitialiser userLoaded pour éviter les redirections
            return null;
          } finally {
            // Réinitialiser le flag global même en cas d'erreur
            globalAuthCache.profileLoadingInProgress = false;
            globalAuthCache.loadingPromise = null;
          }
            })() as Promise<User | null>;
            
            // Attendre le chargement et mettre à jour tous les composants qui écoutent
            globalAuthCache.loadingPromise.then((loadedUser) => {
              if (loadedUser && mounted) {
                setUser(loadedUser);
              }
            }).catch(() => {
              // Erreur déjà gérée dans le try/catch
            });
          } else if (globalAuthCache.loadingPromise && globalAuthCache.lastLoadedUserId === session.user.id) {
            // Un chargement est déjà en cours pour cet utilisateur, attendre le résultat
            globalAuthCache.loadingPromise.then((loadedUser) => {
              if (loadedUser && mounted) {
                setUser(loadedUser);
                setIsLoading(false);
              }
            }).catch(() => {
              if (mounted) {
                setIsLoading(false);
              }
            });
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
          // Réinitialiser le cache global
          globalAuthCache.profileLoadingInProgress = false;
          globalAuthCache.lastLoadedUserId = null;
          globalAuthCache.lastLoadedUser = null;
          globalAuthCache.loadingPromise = null;
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
            // Mettre à jour user et isLoading en même temps
            // React batch les mises à jour, donc c'est sûr
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
    try {
      // Réinitialiser le cache global lors de la déconnexion
      globalAuthCache.profileLoadingInProgress = false;
      globalAuthCache.lastLoadedUserId = null;
      globalAuthCache.lastLoadedUser = null;
      globalAuthCache.loadingPromise = null;
      
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'server';
      logAuth.logout('Déconnexion initiée', { 
        userId: user?.id,
        pathname: currentPath
      });

      // Déconnexion côté client
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        logAuth.logout('Erreur lors de la déconnexion côté client', { 
          error: signOutError.message 
        });
        // Continuer quand même avec la déconnexion côté serveur
      }

      // Déconnexion côté serveur pour s'assurer que les cookies sont supprimés
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (apiError) {
        // Si l'API échoue, continuer quand même
        logAuth.logout('Erreur lors de la déconnexion côté serveur', { 
          error: apiError instanceof Error ? apiError.message : 'Erreur inconnue'
        });
      }

      // Réinitialiser l'état utilisateur
      setUser(null);
      
      logAuth.redirect(currentPath, '/', 'Déconnexion manuelle');
      
      // Utiliser window.location.href pour forcer une redirection complète
      // Cela garantit que la page est complètement rechargée et que les cookies sont bien supprimés
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    } catch (error) {
      logAuth.logout('Erreur inattendue lors de la déconnexion', { 
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
      
      // En cas d'erreur, forcer quand même la redirection
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userStatus: user?.status || null,
    logout,
  };
}

