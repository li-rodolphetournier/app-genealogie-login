/**
 * Schémas de validation Zod pour les messages
 */

import { z } from 'zod';

/**
 * Schéma pour créer un message
 */
export const messageCreateSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre ne peut pas dépasser 200 caractères'),
  content: z.string().min(1, 'Le contenu est requis'),
  images: z.array(z.string().url('URL d\'image invalide')).optional(),
  userId: z.string().min(1, 'L\'ID utilisateur est requis'),
  userName: z.string().min(1, 'Le nom d\'utilisateur est requis'),
});

/**
 * Schéma pour mettre à jour un message
 */
export const messageUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  images: z.array(z.string().url()).optional(),
  userId: z.string().min(1).optional(),
  userName: z.string().min(1).optional(),
});

/**
 * Types inférés depuis les schémas
 */
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;

