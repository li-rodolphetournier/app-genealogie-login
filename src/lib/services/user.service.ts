/**
 * Service pour la gestion des utilisateurs
 * Couche d'accès aux données (DAL)
 */

import fs from 'fs/promises';
import path from 'path';
import { cache } from 'react';
import type { User, UserCreateInput, UserUpdateInput } from '@/types/user';

const usersPath = path.join(process.cwd(), 'src/data/users.json');

// Fonction de lecture des utilisateurs
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

export class UserService {
  /**
   * Récupérer tous les utilisateurs
   */
  static async findAll(): Promise<User[]> {
    const users = await readUsers();
    return users.map(({ password: _, ...user }) => user);
  }

  /**
   * Récupérer un utilisateur par login
   */
  static async findByLogin(login: string): Promise<User | null> {
    const users = await readUsers();
    const user = users.find(u => u.login === login);
    if (!user) return null;
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Récupérer un utilisateur avec mot de passe (pour authentification)
   */
  static async findByLoginWithPassword(login: string): Promise<(User & { password: string }) | null> {
    const users = await readUsers();
    return users.find(u => u.login === login) as (User & { password: string }) | null || null;
  }

  /**
   * Créer un utilisateur
   */
  static async create(input: UserCreateInput & { password: string }): Promise<User> {
    const users = await readUsers();
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = users.find(u => u.login === input.login || u.email === input.email);
    if (existingUser) {
      throw new Error('Utilisateur ou email déjà utilisé');
    }

    const newUser: User & { password: string } = {
      id: Date.now().toString(),
      login: input.login,
      email: input.email,
      status: input.status,
      nom: input.nom,
      prenom: input.prenom,
      dateNaissance: input.dateNaissance,
      profileImage: input.profileImage,
      description: input.description,
      password: input.password,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    await writeUsers(users);

    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async update(login: string, input: UserUpdateInput): Promise<User> {
    const users = await readUsers();
    const userIndex = users.findIndex(u => u.login === login);

    if (userIndex === -1) {
      throw new Error('Utilisateur non trouvé');
    }

    const updatedUser = {
      ...users[userIndex],
      ...input,
      login, // Garantir que le login ne change pas
      updatedAt: new Date().toISOString(),
    };

    users[userIndex] = updatedUser;
    await writeUsers(users);

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Supprimer un utilisateur
   */
  static async delete(login: string): Promise<void> {
    const users = await readUsers();
    const filteredUsers = users.filter(u => u.login !== login);

    if (users.length === filteredUsers.length) {
      throw new Error('Utilisateur non trouvé');
    }

    await writeUsers(filteredUsers);
  }
}

