import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { User, UserCreateInput, UserResponse } from '@/types/user';
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
      { error: 'Erreur serveur lors de la récupération des utilisateurs' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel utilisateur
export async function POST(request: Request) {
  try {
    const body: UserCreateInput = await request.json();
    const { login, email, password, status, nom, prenom, description, profileImage } = body;

    // Validation
    if (!login || !email || !password || !status) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Champs obligatoires (login, email, password, status) manquants' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Le mot de passe doit faire au moins 6 caractères' },
        { status: 400 }
      );
    }

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

    // TODO: Hasher le mot de passe avec bcrypt avant de l'ajouter
    // Pour l'instant, on stocke en clair (migration progressive)
    const userWithPassword = { ...newUser, password };

    users.push(userWithPassword as User & { password: string });
    await writeUsers(users as User[]);

    const { password: _, ...userWithoutPassword } = userWithPassword;

    return NextResponse.json<SuccessResponse<UserResponse>>(
      { message: 'Utilisateur créé avec succès', data: userWithoutPassword },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erreur API create-user:', error);
    return NextResponse.json<ErrorResponse>(
      { error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

