/**
 * Middleware d'authentification avec Supabase
 * Utilitaires pour vérifier l'authentification et les rôles
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@/types/user';
import { isMockModeEnabled, createMockUser, isMockUserId } from '@/lib/features/mock-auth';
import { logger } from '@/lib/utils/logger';

export type AuthResult = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isRedactor: boolean;
};

/**
 * Récupère l'utilisateur authentifié depuis les cookies Supabase
 * Gère également le mode mock en développement
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    
    // Vérifier le mode mock (uniquement en développement)
    const mockId = cookieStore.get('mock-user-id')?.value;
    if (mockId && isMockModeEnabled()) {
      const mockUser = createMockUser(mockId);
      return {
        user: mockUser,
        isAuthenticated: true,
        isAdmin: true, // Le mock a toujours les droits admin
        isRedactor: true,
      };
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Variables d\'environnement Supabase manquantes. Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies.'
      );
    }
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
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

    // Si c'est un ID mock, retourner directement le mock
    if (isMockUserId(authUser.id) && isMockModeEnabled()) {
      const mockUser = createMockUser(authUser.id.replace('mock-', ''));
      return {
        user: mockUser,
        isAuthenticated: true,
        isAdmin: true,
        isRedactor: true,
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
    logger.error('Erreur lors de la vérification de l\'authentification:', error);
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

