import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { userUpdateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import { getErrorMessage } from '@/lib/errors/messages';
import type { User, UserResponse } from '@/types/user';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const usersPath = path.join(process.cwd(), 'src/data/users.json');

async function readUsers(): Promise<(User & { password?: string })[]> {
  try {
    const data = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeUsers(users: (User & { password?: string })[]): Promise<void> {
  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
}

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
    const users = await readUsers();
    const user = users.find(u => u.login === login);

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json<UserResponse>(userWithoutPassword, { status: 200 });
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
    
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.login === login);

    if (userIndex === -1) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    // Mettre à jour l'utilisateur
    const updateData: any = { ...validation.data };
    
    // Hasher le mot de passe si fourni
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
    const updatedUser = {
      ...users[userIndex],
      ...updateData,
      login, // Garantir que le login ne change pas
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    await writeUsers(users);

    // Revalider le cache
    revalidatePath('/users', 'page');
    revalidatePath(`/users/${login}`, 'page');

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json<SuccessResponse<UserResponse>>(
      { message: 'Utilisateur mis à jour avec succès', data: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
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
    const users = await readUsers();
    const filteredUsers = users.filter(u => u.login !== login);

    if (users.length === filteredUsers.length) {
      return NextResponse.json<ErrorResponse>(
        { error: getErrorMessage('USER_NOT_FOUND') },
        { status: 404 }
      );
    }

    await writeUsers(filteredUsers);

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

