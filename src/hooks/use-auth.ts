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

    const loadUser = async () => {
      try {
        // Utiliser getUser() qui fait une requête HTTP et lit les cookies httpOnly
        // C'est la méthode recommandée avec @supabase/ssr pour les cookies httpOnly
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !authUser) {
          logger.debug('[useAuth] Aucune session trouvée:', userError?.message);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
            if (redirectIfUnauthenticated) {
              router.push(redirectTo);
            }
          }
          return;
        }

        logger.debug('[useAuth] Utilisateur trouvé:', authUser.email);

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
        logger.error('[useAuth] Erreur inattendue lors du chargement de l\'utilisateur:', error);
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
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setIsLoading(false);
          if (redirectIfUnauthenticated) {
            router.push(redirectTo);
          }
          return;
        }

        if (session?.user) {
          // Récupérer le profil utilisateur
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

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

          setUser(userData);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
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

