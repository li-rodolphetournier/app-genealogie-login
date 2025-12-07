import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import type { LoginRequest, LoginResponse, ErrorResponse } from '@/types/api/requests';
import type { User } from '@/types/user';

const usersPath = path.join(process.cwd(), 'src/data/users.json');

async function readUsers(): Promise<User[]> {
  try {
    const data = fs.readFileSync(usersPath, 'utf8');
    return JSON.parse(data) as User[];
  } catch (error) {
    console.error('Erreur lecture users.json:', error);
    return [];
  }
}

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Login et mot de passe requis' },
        { status: 400 }
      );
    }

    const users = await readUsers();
    const user = users.find(u => u.login === login);

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Vérifier le mot de passe
    // Note: Si les mots de passe sont en clair dans le JSON, on les compare directement
    // Sinon, on utilise bcrypt.compare
    const userWithPassword = user as User & { password?: string };
    let passwordValid = false;

    if (userWithPassword.password) {
      // Si le mot de passe est hashé, utiliser bcrypt
      if (userWithPassword.password.startsWith('$2')) {
        passwordValid = await bcrypt.compare(password, userWithPassword.password);
      } else {
        // Sinon, comparer en clair (pour migration progressive)
        passwordValid = userWithPassword.password === password;
      }
    }

    if (!passwordValid) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    // Omettre le mot de passe de la réponse
    const { password: _, ...userWithoutPassword } = userWithPassword;

    const response: LoginResponse = {
      user: userWithoutPassword,
    };

    return NextResponse.json<LoginResponse>(response, { status: 200 });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

