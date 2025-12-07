/**
 * Middleware d'authentification avec Supabase
 * Utilitaires pour vérifier l'authentification et les rôles
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@/types/user';

export type AuthResult = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRedactor: boolean;
};

/**
 * Récupère l'utilisateur authentifié depuis les cookies Supabase
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Erreur silencieuse si les cookies ne peuvent pas être définis
              // (par exemple, dans les middleware ou lors du rendu)
            }
          },
        },
      }
    );

    // Vérifier la session Supabase
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isRedactor: false,
      };
    }

    // Récupérer le profil utilisateur depuis la table users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return {
        user: null,
        isAuthenticated: false,
        isAdmin: false,
        isRedactor: false,
      };
    }

    const user: User = {
      id: profile.id,
      login: profile.login,
      email: profile.email,
      status: profile.status,
      profileImage: profile.profile_image || undefined,
      description: profile.description || undefined,
      detail: profile.detail || undefined,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return {
      user,
      isAuthenticated: true,
      isAdmin: user.status === 'administrateur',
      isRedactor: user.status === 'redacteur' || user.status === 'administrateur',
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isRedactor: false,
    };
  }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function requireAuth(): Promise<User> {
  const auth = await getAuthenticatedUser();
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Non authentifié');
  }
  
  return auth.user;
}

/**
 * Vérifie si l'utilisateur est administrateur
 */
export async function requireAdmin(): Promise<User> {
  const auth = await getAuthenticatedUser();
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Non authentifié');
  }
  
  if (!auth.isAdmin) {
    throw new Error('Accès refusé : droits administrateur requis');
  }
  
  return auth.user;
}

/**
 * Vérifie si l'utilisateur est rédacteur ou administrateur
 */
export async function requireRedactor(): Promise<User> {
  const auth = await getAuthenticatedUser();
  
  if (!auth.isAuthenticated || !auth.user) {
    throw new Error('Non authentifié');
  }
  
  if (!auth.isRedactor) {
    throw new Error('Accès refusé : droits rédacteur requis');
  }
  
  return auth.user;
}

