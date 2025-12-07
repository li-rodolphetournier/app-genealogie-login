import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import { userCreateSchema } from '@/lib/validations';
import { validateWithSchema, createValidationErrorResponse } from '@/lib/validations/utils';
import type { User, UserResponse } from '@/types/user';
import type { ErrorResponse, SuccessResponse } from '@/types/api/responses';

const usersPath = path.join(process.cwd(), 'src/data/users.json');

async function readUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(data) as User[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    console.error('Erreur lecture users.json:', error);
    throw new Error('Impossible de lire les données utilisateur.');
  }
}

async function writeUsers(users: User[]): Promise<void> {
  try {
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2), 'utf-8');
  } catch (error) {
    console.error("Erreur d'écriture dans users.json:", error);
    throw new Error("Impossible de sauvegarder les données utilisateur.");
  }
}

// GET - Récupérer tous les utilisateurs
export async function GET() {
  try {
    const users = await readUsers();
    
    // Retirer les mots de passe avant d'envoyer
    const sanitizedUsers: UserResponse[] = users.map(({ password: _, ...user }) => user);
    
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
    
    const { login, email, password, status, nom, prenom, description, profileImage } = validation.data;

    const users = await readUsers();

    // Vérifier si l'utilisateur ou l'email existe déjà
    const existingUser = users.find(u => u.login === login || u.email === email);
    if (existingUser) {
      const field = existingUser.login === login ? 'Login' : 'Email';
      return NextResponse.json<ErrorResponse>(
        { error: `${field} déjà utilisé` },
        { status: 409 }
      );
    }

    // Créer le nouvel utilisateur
    const newUser: User = {
      id: Date.now().toString(),
      login,
      email,
      status,
      nom,
      prenom,
      description,
      profileImage,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Hasher le mot de passe avec bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    const userWithPassword = { ...newUser, password: passwordHash } as User & { password: string };

    users.push(userWithPassword as User & { password: string });
    await writeUsers(users as User[]);

    // Revalider le cache pour les pages utilisateurs
    revalidatePath('/users', 'page');
    revalidatePath('/users/[login]', 'page');

    const { password: _, ...userWithoutPassword } = userWithPassword;

    return NextResponse.json<SuccessResponse<UserResponse>>(
      { message: 'Utilisateur créé avec succès', data: userWithoutPassword },
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

