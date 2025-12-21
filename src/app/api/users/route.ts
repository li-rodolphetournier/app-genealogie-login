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

    // Vérifier si l'utilisateur ou l'email existe déjà dans la table users
    const { data: existingUser } = await supabase
      .from('users')
      .select('login, email, id')
      .or(`login.eq.${login},email.eq.${email}`)
      .limit(1)
      .maybeSingle();

    if (existingUser) {
      const field = existingUser.login === login ? 'Login' : 'Email';
      return NextResponse.json<ErrorResponse>(
        { error: `${field} déjà utilisé` },
        { status: 409 }
      );
    }

    // Vérifier aussi dans auth.users si l'email existe déjà
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers?.users?.find(
      (u) => u.email === email || u.user_metadata?.login === login
    );

    if (existingAuthUser) {
      // Si l'utilisateur Auth existe mais pas dans users, on peut réutiliser son ID
      // Vérifier s'il n'existe pas déjà dans users avec cet ID
      const { data: checkUser, error: checkError } = await supabase
        .from('users')
        .select('id, login, email')
        .eq('id', existingAuthUser.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Erreur lors de la vérification de l\'utilisateur:', checkError);
        return NextResponse.json<ErrorResponse>(
          { error: `Erreur lors de la vérification: ${checkError.message}` },
          { status: 500 }
        );
      }

      // Si l'utilisateur existe déjà dans users, vérifier si c'est le même email/login
      if (checkUser) {
        if (checkUser.login === login || checkUser.email === email) {
          return NextResponse.json<ErrorResponse>(
            { error: 'Cet utilisateur existe déjà dans la base de données' },
            { status: 409 }
          );
        } else {
          // ID existe mais avec des données différentes - c'est un conflit
          return NextResponse.json<ErrorResponse>(
            { error: 'Conflit: cet ID est déjà utilisé par un autre utilisateur. Veuillez contacter un administrateur.' },
            { status: 409 }
          );
        }
      }

      // Réutiliser l'utilisateur Auth existant et créer le profil
      const { data: newUser, error: profileError } = await supabase
        .from('users')
        .insert({
          id: existingAuthUser.id,
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
        console.error('Erreur création profil utilisateur:', profileError);
        
        // Si l'erreur est une clé dupliquée, c'est qu'un utilisateur avec cet ID existe maintenant
        if (profileError?.code === '23505') {
          // Vérifier à nouveau si l'utilisateur existe maintenant
          const { data: existingUserNow } = await supabase
            .from('users')
            .select('login, email')
            .eq('id', existingAuthUser.id)
            .maybeSingle();
          
          if (existingUserNow) {
            if (existingUserNow.login === login || existingUserNow.email === email) {
              return NextResponse.json<ErrorResponse>(
                { error: 'Cet utilisateur existe déjà dans la base de données' },
                { status: 409 }
              );
            }
          }
          
          return NextResponse.json<ErrorResponse>(
            { error: 'Cet utilisateur existe déjà dans la base de données. L\'ID est déjà utilisé.' },
            { status: 409 }
          );
        }
        
        return NextResponse.json<ErrorResponse>(
          { 
            error: `Erreur lors de la création du profil: ${profileError?.message || 'Erreur inconnue'}` 
          },
          { status: 500 }
        );
      }

      // Mapper et retourner la réponse
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

      revalidatePath('/users', 'page');
      revalidatePath('/users/[login]', 'page');

      return NextResponse.json<SuccessResponse<UserResponse>>(
        { message: 'Utilisateur créé avec succès', data: userResponse },
        { status: 201 }
      );
    }

    // Créer l'utilisateur dans Supabase Auth d'abord
    // Passer les métadonnées pour que le trigger crée le profil avec les bonnes valeurs
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        login: login,
        status: status,
      },
    });

    if (authError || !authUser.user) {
      console.error('Erreur création utilisateur Auth:', authError);
      console.error('Détails de l\'erreur:', JSON.stringify(authError, null, 2));
      
      // Si l'erreur est liée à un email déjà utilisé
      if (authError?.message?.includes('already registered') || authError?.message?.includes('already exists')) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }

      return NextResponse.json<ErrorResponse>(
        { error: `Erreur lors de la création de l'utilisateur: ${authError?.message || 'Erreur inconnue'}` },
        { status: 500 }
      );
    }

    console.log('✅ Utilisateur Auth créé avec succès:', authUser.user.id);

    // Vérifier une dernière fois que l'ID n'existe pas déjà dans users (race condition)
    const { data: checkExisting } = await supabase
      .from('users')
      .select('id, login, email')
      .eq('id', authUser.user.id)
      .maybeSingle();

    if (checkExisting) {
      // Supprimer l'utilisateur Auth qu'on vient de créer car l'ID est déjà utilisé
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
      } catch (deleteError) {
        console.error('Erreur lors de la suppression de l\'utilisateur Auth:', deleteError);
      }
      
      if (checkExisting.login === login || checkExisting.email === email) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Cet utilisateur existe déjà dans la base de données' },
          { status: 409 }
        );
      }
      
      return NextResponse.json<ErrorResponse>(
        { error: 'Conflit: cet ID est déjà utilisé par un autre utilisateur. Veuillez réessayer.' },
        { status: 409 }
      );
    }

    // Vérifier si le profil existe déjà (créé par le trigger)
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.user.id)
      .maybeSingle();

    let newUser;
    
    if (existingProfile) {
      // Le profil existe déjà (créé par le trigger), le mettre à jour avec les bonnes valeurs
      console.log('⚠️  Profil déjà créé par le trigger, mise à jour...');
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          login,
          email,
          status,
          profile_image: profileImage || null,
          description: description || null,
          detail: null,
        })
        .eq('id', authUser.user.id)
        .select()
        .single();

      if (updateError || !updatedUser) {
        console.error('Erreur mise à jour profil utilisateur:', updateError);
        // Supprimer l'utilisateur Auth si la mise à jour échoue
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } catch (deleteError) {
          console.error('Erreur lors de la suppression de l\'utilisateur Auth:', deleteError);
        }
        
        return NextResponse.json<ErrorResponse>(
          { error: `Erreur lors de la mise à jour du profil: ${updateError?.message || 'Erreur inconnue'}` },
          { status: 500 }
        );
      }
      
      newUser = updatedUser;
    } else {
      // Créer le profil dans la table users
      const { data: insertedUser, error: profileError } = await supabase
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

      if (profileError || !insertedUser) {
        // Si l'insertion du profil échoue, supprimer l'utilisateur Auth
        try {
          await supabase.auth.admin.deleteUser(authUser.user.id);
        } catch (deleteError) {
          console.error('Erreur lors de la suppression de l\'utilisateur Auth:', deleteError);
        }
        
        console.error('Erreur création profil utilisateur:', profileError);
        
        // Message d'erreur plus explicite
        if (profileError?.code === '23505') {
          return NextResponse.json<ErrorResponse>(
            { error: 'Cet utilisateur existe déjà dans la base de données. L\'ID est déjà utilisé.' },
            { status: 409 }
          );
        }

        return NextResponse.json<ErrorResponse>(
          { error: `Erreur lors de la création du profil: ${profileError?.message || 'Erreur inconnue'}` },
          { status: 500 }
        );
      }
      
      newUser = insertedUser;
    }
    
    console.log('✅ Profil utilisateur créé/mis à jour avec succès:', newUser.id);

    // Mapper les champs Supabase vers le format UserResponse (pour le nouveau utilisateur créé)
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
  } catch (error: unknown) {
    console.error('Erreur API create-user:', error);
    
    // Gérer spécifiquement les erreurs de clé dupliquée
    const errorObj = error as { code?: string; message?: string };
    if (errorObj?.code === '23505' || errorObj?.message?.includes('duplicate key')) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Cet utilisateur existe déjà dans la base de données' },
        { status: 409 }
      );
    }
    
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : getErrorMessage('USER_CREATE_FAILED') },
      { status: 500 }
    );
  }
}

