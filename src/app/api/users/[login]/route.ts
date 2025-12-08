import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { userUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { User, UserResponse } from '@/types/user';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

type RouteContext = {
  params: Promise<{ login: string }>;
};

// GET - Récupérer un utilisateur par login
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { login } = await context.params;
    const supabase = await createServiceRoleClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', login)
      .single();

    if (error || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Mapper les champs Supabase vers le format User
    const userResponse: UserResponse = {
      id: user.id,
      login: user.login,
      email: user.email,
      status: user.status as User['status'],
      profileImage: user.profile_image || undefined,
      description: user.description || undefined,
      detail: user.detail || undefined,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    return NextResponse.json<UserResponse>(userResponse, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un utilisateur
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { login } = await context.params;
    const body = await request.json();
    
    // Validation Zod
    const validation = validateWithSchema(userUpdateSchema, body);
    if (!validation.success) {
      return createValidationErrorResponse(validation.error);
    }
    
    const supabase = await createServiceRoleClient();

    // Vérifier que l'utilisateur existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('login', login)
      .single();

    if (findError || !existingUser) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour pour Supabase
    const updateData: Record<string, any> = {};
    
    if (validation.data.email !== undefined) {
      updateData.email = validation.data.email;
    }
    if (validation.data.description !== undefined) {
      updateData.description = validation.data.description || null;
    }
    if (validation.data.detail !== undefined) {
      updateData.detail = validation.data.detail || null;
    }
    if (validation.data.profileImage !== undefined) {
      updateData.profile_image = validation.data.profileImage || null;
    }
    if (validation.data.status !== undefined) {
      updateData.status = validation.data.status;
    }
    // Note: nom, prenom, dateNaissance ne sont pas dans le schéma Supabase users
    // Ils peuvent être ajoutés plus tard si nécessaire

    // Mettre à jour dans Supabase
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('login', login)
      .select()
      .single();

    if (updateError || !updatedUser) {
      console.error('Erreur Supabase lors de la mise à jour:', updateError);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Mapper les champs Supabase vers le format User
    const userResponse: UserResponse = {
      id: updatedUser.id,
      login: updatedUser.login,
      email: updatedUser.email,
      status: updatedUser.status as User['status'],
      profileImage: updatedUser.profile_image || undefined,
      description: updatedUser.description || undefined,
      detail: updatedUser.detail || undefined,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at,
    };

    // Revalider le cache
    revalidatePath('/users', 'page');
    revalidatePath(`/users/${login}`, 'page');

    return NextResponse.json<SuccessResponse<UserResponse>>(
      { message: 'Utilisateur mis à jour avec succès', data: userResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('Détails de l\'erreur:', errorMessage);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { login } = await context.params;
    const supabase = await createServiceRoleClient();

    // Vérifier que l'utilisateur existe
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('login', login)
      .single();

    if (findError || !existingUser) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Supprimer l'utilisateur (la contrainte CASCADE supprimera aussi auth.users)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('login', login);

    if (deleteError) {
      console.error('Erreur Supabase lors de la suppression:', deleteError);
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('SERVER_ERROR') },
        { status: 500 }
      );
    }

    // Revalider le cache
    revalidatePath('/users', 'page');
    revalidatePath(`/users/${login}`, 'page');

    return NextResponse.json<SuccessResponse>(
      { message: 'Utilisateur supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    return NextResponse.json<ErrorResponse>(
      { error: getErrorMessage('SERVER_ERROR') },
      { status: 500 }
    );
  }
}

