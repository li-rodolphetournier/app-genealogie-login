/**
 * Schémas de validation Zod pour les utilisateurs
 */

import { z } from 'zod';

/**
 * Schéma pour créer un utilisateur
 */
export const userCreateSchema = z.object({
  login: z.string().min(3, 'Le login doit contenir au moins 3 caractères').max(50, 'Le login ne peut pas dépasser 50 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  status: z.enum(['administrateur', 'utilisateur', 'redacteur'], {
    errorMap: () => ({ message: 'Le statut doit être administrateur, utilisateur ou redacteur' })
  }),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  dateNaissance: z.string().optional(),
  profileImage: z.string().url('URL d\'image invalide').optional().or(z.literal('')),
  description: z.string().optional(),
});

/**
 * Schéma pour mettre à jour un utilisateur
 */
export const userUpdateSchema = z.object({
  login: z.string().min(3).max(50).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  status: z.enum(['administrateur', 'utilisateur', 'redacteur']).optional(),
  nom: z.string().optional(),
  prenom: z.string().optional(),
  dateNaissance: z.string().optional(),
  profileImage: z.string().url().optional().or(z.literal('')),
  description: z.string().optional(),
});

/**
 * Schéma pour la connexion
 */
export const loginSchema = z.object({
  login: z.string().min(1, 'Le login est requis'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

/**
 * Types inférés depuis les schémas
 */
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

