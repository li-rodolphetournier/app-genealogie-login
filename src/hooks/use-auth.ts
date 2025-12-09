/**
 * Hook personnalisé pour gérer l'authentification utilisateur
 * Utilise Supabase Auth pour une authentification sécurisée
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
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

    const loadUser = async () => {
      try {
        // Timeout de sécurité pour éviter que le chargement reste bloqué
        timeoutId = setTimeout(() => {
          if (mounted) {
            logger.debug('[useAuth] Timeout lors du chargement de l\'utilisateur');
            setUser(null);
            setIsLoading(false);
            if (redirectIfUnauthenticated) {
              router.push(redirectTo);
            }
          }
        }, 5000); // 5 secondes maximum

        // Créer une promesse avec timeout pour getUser()
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => {
            reject(new Error('Timeout'));
          }, 4000)
        );
        
        let authResult;
        try {
          // Utiliser getUser() qui fait une requête HTTP et lit les cookies httpOnly
          // C'est la méthode recommandée avec @supabase/ssr pour les cookies httpOnly
          authResult = await Promise.race([
            authPromise,
            timeoutPromise,
          ]);
        } catch (error) {
          // Si c'est un timeout, ne pas déconnecter immédiatement
          // Il peut s'agir d'un problème réseau temporaire
          if (error instanceof Error && error.message === 'Timeout') {
            logger.debug('[useAuth] Timeout lors de la vérification de session - tentative de récupération...');
            
            // Réessayer une fois avec un délai plus court
            try {
              const retryResult = await Promise.race([
                supabase.auth.getUser(),
                new Promise<never>((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout')), 2000)
                ),
              ]);
              
              const { data: { user: retryUser }, error: retryError } = retryResult;
              if (retryError || !retryUser) {
                // Vraiment pas de session
                logger.debug('[useAuth] Aucune session trouvée après retry');
                if (timeoutId) clearTimeout(timeoutId);
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
            } catch (retryError) {
              // Échec du retry aussi
              logger.debug('[useAuth] Aucune session trouvée après retry échoué');
              if (timeoutId) clearTimeout(timeoutId);
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
        
        if (timeoutId) clearTimeout(timeoutId);
        
        const { data: { user: authUser }, error: userError } = authResult;
        
        if (userError || !authUser) {
          logger.debug('[useAuth] Aucune session trouvée:', userError?.message);
          logger.debug(`[useAuth] redirectIfUnauthenticated: ${redirectIfUnauthenticated}, redirectTo: ${redirectTo}`);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            if (redirectIfUnauthenticated) {
              logger.debug(`[useAuth] Redirection vers ${redirectTo} depuis loadUser`);
              router.push(redirectTo);
            }
          }
          return;
        }

        logger.debug('[useAuth] Utilisateur trouvé dans loadUser:', authUser.email);

        // Récupérer le profil utilisateur depuis la table users
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          logger.error('[useAuth] Erreur lors de la récupération du profil:', profileError);
        }

        if (mounted) {
          // Construire l'objet utilisateur
          const userData: User = {
            id: authUser.id,
            login: profile?.login || authUser.email?.split('@')[0] || '',
            email: authUser.email || profile?.email || '',
            status: (profile?.status as User['status']) || 'utilisateur',
            description: profile?.description || null,
            profileImage: profile?.profile_image || null,
            createdAt: profile?.created_at || new Date().toISOString(),
            updatedAt: profile?.updated_at || new Date().toISOString(),
          };

          logger.debug('[useAuth] Utilisateur chargé avec succès:', userData.login);
          setUser(userData);
          setIsLoading(false);
        }
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
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
        logger.debug(`[useAuth] Événement auth: ${event}, session:`, session ? `présente (user: ${session.user?.email})` : 'absente');
        
        if (!mounted) {
          logger.debug('[useAuth] Composant démonté, ignoré');
          return;
        }

        // Seulement réagir aux événements SIGNED_OUT explicites
        // Ne pas déconnecter pour les autres événements qui peuvent avoir une session null temporairement
        if (event === 'SIGNED_OUT') {
          logger.debug('[useAuth] Déconnexion explicite détectée');
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            if (redirectIfUnauthenticated) {
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
      subscription.unsubscribe();
    };
  }, [redirectIfUnauthenticated, redirectTo, router, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
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

