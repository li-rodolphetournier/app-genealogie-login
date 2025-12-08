import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { userCreateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { User, UserResponse } from '@/types/user';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

// GET - Récupérer tous les utilisateurs
export async function GET() {
  try {
    const supabase = await createServiceRoleClient();

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur Supabase lors de la récupération des utilisateurs:', error);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Mapper les champs Supabase vers le format UserResponse
    const sanitizedUsers: UserResponse[] = (users || []).map((user) => ({
      id: user.id,
      login: user.login,
      email: user.email,
      status: user.status as User['status'],
      profileImage: user.profile_image || undefined,
      description: user.description || undefined,
      detail: user.detail || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
    
    return NextResponse.json<UserResponse[]>(sanitizedUsers, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(userCreateSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const { login, email, password, status, description, profileImage } = validation.data;
    const supabase = await createServiceRoleClient();

    // Vérifier si l'utilisateur ou l'email existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('login, email')
      .or(`login.eq.${login},email.eq.${email}`)
      .limit(1)
      .single();

    if (existingUser) {
      const field = existingUser.login === login ? 'Login' : 'Email';
      return NextResponse.json<ErrorResponse>(
        { error: `${field} déjà utilisé` },
        { status: 409 }
      );
    }

    // Créer l'utilisateur dans Supabase Auth d'abord
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      console.error('Erreur création utilisateur Auth:', authError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la création de l\'utilisateur' },
        { status: 500 }
      );
    }

    // Créer le profil dans la table users
    const { data: newUser, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        login,
        email,
        status,
        profile_image: profileImage || null,
        description: description || null,
        detail: null,
      })
      .select()
      .single();

    if (profileError || !newUser) {
      // Si l'insertion du profil échoue, supprimer l'utilisateur Auth
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.error('Erreur création profil utilisateur:', profileError);
      return NextResponse.json<ErrorResponse>(
        { error: 'Erreur lors de la création du profil utilisateur' },
        { status: 500 }
      );
    }

    // Mapper les champs Supabase vers le format UserResponse
    const userResponse: UserResponse = {
      id: newUser.id,
      login: newUser.login,
      email: newUser.email,
      status: newUser.status as User['status'],
      profileImage: newUser.profile_image || undefined,
      description: newUser.description || undefined,
      detail: newUser.detail || undefined,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at,
    };

    // Revalider le cache pour les pages utilisateurs
    revalidatePath('/users', 'page');
    revalidatePath('/users/[login]', 'page');

    return NextResponse.json<SuccessResponse<UserResponse>>(
      { message: 'Utilisateur créé avec succès', data: userResponse },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur API create-user:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('USER_CREATE_FAILED') },
      { status: 500 }
    );
  }
}

