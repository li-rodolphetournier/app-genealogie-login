/**
 * Route API de login avec Supabase Auth
 * Utilise Supabase Auth pour une authentification sécurisée
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { loginSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import { logError } from '@/lib/errors/error-handler';
import type { LoginRequest } from '@/types/api/requests';
import type { LoginResponse, ErrorResponse } from '@/types/api/responses';
import type { User } from '@/types/user';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(loginSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const { login, password } = validation.data;
    const supabase = await createClient();

    // Tentative 1 : Essayer avec l'email
    let authResult = await supabase.auth.signInWithPassword({
      email: login,
      password,
    });

    // Tentative 2 : Si échec, chercher par login dans la table users
    // Utiliser createServiceRoleClient pour contourner le RLS
    if (authResult.error) {
      const serviceSupabase = await createServiceRoleClient();
      const { data: userByLogin } = await serviceSupabase
        .from('users')
        .select('email')
        .eq('login', login)
        .single();

      if (userByLogin?.email) {
        authResult = await supabase.auth.signInWithPassword({
          email: userByLogin.email,
          password,
        });
      }
    }

    if (authResult.error || !authResult.data.user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Récupérer le profil utilisateur depuis la table users
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authResult.data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, ce qui est normal si le profil n'existe pas encore
      console.error('Erreur lors de la récupération du profil:', profileError);
    }

    // Construire l'objet utilisateur
    const user: User = {
      id: authResult.data.user.id,
      login: profile?.login || login,
      email: authResult.data.user.email || profile?.email || '',
      status: (profile?.status as User['status']) || 'utilisateur',
      description: profile?.description || null,
      profileImage: profile?.profile_image || null,
      createdAt: profile?.created_at || new Date().toISOString(),
      updatedAt: profile?.updated_at || new Date().toISOString(),
    };

    const response: LoginResponse = {
      user,
    };

    return NextResponse.json<LoginResponse>(response, { status: 200 });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

