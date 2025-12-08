/**
 * Service pour la gestion des utilisateurs
 * Couche d'accès aux données (DAL) - Utilise Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { User, UserCreateInput, UserUpdateInput } from '@/types/user';

export class UserService {
  /**
   * Récupérer tous les utilisateurs
   */
  static async findAll(): Promise<User[]> {
    const supabase = await createServiceRoleClient();
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }

    return (users || []).map((user) => ({
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
  }

  /**
   * Récupérer un utilisateur par login
   */
  static async findByLogin(login: string): Promise<User | null> {
    const supabase = await createServiceRoleClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('login', login)
      .single();

    if (error || !user) {
      return null;
    }

    return {
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
  }

  /**
   * Récupérer un utilisateur avec mot de passe (pour authentification)
   * Note: Avec Supabase Auth, les mots de passe sont gérés par auth.users
   * Cette méthode retourne null car les mots de passe ne sont plus dans public.users
   */
  static async findByLoginWithPassword(login: string): Promise<(User & { password: string }) | null> {
    // Avec Supabase Auth, l'authentification se fait via auth.users
    // Cette méthode est conservée pour compatibilité mais retourne null
    // L'authentification doit utiliser Supabase Auth directement
    return null;
  }

  /**
   * Créer un utilisateur
   * Note: Nécessite la création dans auth.users d'abord via Supabase Auth
   */
  static async create(input: UserCreateInput & { password: string }): Promise<User> {
    const supabase = await createServiceRoleClient();
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from('users')
      .select('login, email')
      .or(`login.eq.${input.login},email.eq.${input.email}`)
      .limit(1)
      .single();

    if (existingUser) {
      throw new Error('Utilisateur ou email déjà utilisé');
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error(`Erreur lors de la création de l'utilisateur: ${authError?.message || 'Erreur inconnue'}`);
    }

    // Créer le profil dans la table users
    const { data: newUser, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        login: input.login,
        email: input.email,
        status: input.status,
        profile_image: input.profileImage || null,
        description: input.description || null,
        detail: input.detail || null,
      })
      .select()
      .single();

    if (profileError || !newUser) {
      // Nettoyer: supprimer l'utilisateur Auth si le profil échoue
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Erreur lors de la création du profil: ${profileError?.message || 'Erreur inconnue'}`);
    }

    return {
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
  }

  /**
   * Mettre à jour un utilisateur
   */
  static async update(login: string, input: UserUpdateInput): Promise<User> {
    const supabase = await createServiceRoleClient();

    // Vérifier que l'utilisateur existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('login', login)
      .single();

    if (!existingUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, any> = {};
    
    if (input.email !== undefined) updateData.email = input.email;
    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.detail !== undefined) updateData.detail = input.detail || null;
    if (input.profileImage !== undefined) updateData.profile_image = input.profileImage || null;
    if (input.status !== undefined) updateData.status = input.status;

    // Mettre à jour dans Supabase
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('login', login)
      .select()
      .single();

    if (error || !updatedUser) {
      throw new Error(`Erreur lors de la mise à jour: ${error?.message || 'Erreur inconnue'}`);
    }

    return {
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
  }

  /**
   * Supprimer un utilisateur
   */
  static async delete(login: string): Promise<void> {
    const supabase = await createServiceRoleClient();

    // Récupérer l'ID de l'utilisateur
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('login', login)
      .single();

    if (findError || !user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Supprimer l'utilisateur (la contrainte CASCADE supprimera aussi auth.users)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('login', login);

    if (deleteError) {
      throw new Error(`Erreur lors de la suppression: ${deleteError.message}`);
    }
  }
}
