/**
 * Route API pour récupérer le profil utilisateur authentifié
 * Utilise le service role client pour contourner le RLS si nécessaire
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { ErrorResponse } from '@/types/api/responses';
import type { User } from '@/types/user';

export async function GET() {
  try {
    // D'abord, vérifier l'authentification avec le client normal
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Essayer de récupérer le profil avec le client normal (respecte RLS)
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    // Si erreur RLS, utiliser le service role client comme fallback
    if (profileError && (profileError.code === '42501' || profileError.message?.includes('permission') || profileError.message?.includes('row-level security'))) {
      const serviceSupabase = await createServiceRoleClient();
      const result = await serviceSupabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      profile = result.data;
      profileError = result.error;
    }

    // Si toujours pas de profil, créer un utilisateur par défaut
    if (profileError && profileError.code === 'PGRST116') {
      // Pas de profil dans public.users, retourner les infos de base depuis auth
      const user: User = {
        id: authUser.id,
        login: authUser.email?.split('@')[0] || '',
        email: authUser.email || '',
        status: 'utilisateur',
        profileImage: undefined,
        description: undefined,
        detail: undefined,
        createdAt: authUser.created_at || new Date().toISOString(),
        updatedAt: authUser.updated_at || new Date().toISOString(),
      };
      
      return NextResponse.json({ user }, { status: 200 });
    }

    if (profileError || !profile) {
      console.error('[API /auth/profile] Erreur lors de la récupération du profil:', profileError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la récupération du profil' },
        { status: 500 }
      );
    }

    // Mapper le profil vers le format User
    const user: User = {
      id: profile.id,
      login: profile.login,
      email: profile.email,
      status: profile.status as User['status'],
      profileImage: profile.profile_image || undefined,
      description: profile.description || undefined,
      detail: profile.detail || undefined,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[API /auth/profile] Erreur:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

