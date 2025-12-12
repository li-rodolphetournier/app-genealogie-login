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
  images: z.array(z.string()).optional(), // Accepter n'importe quelle string pour les images (peut être une URL ou un chemin)
  userId: z.string().min(1, 'L\'ID utilisateur est requis'),
  userName: z.string().min(1, 'Le nom d\'utilisateur est requis'),
  display_on_home: z.boolean().optional().default(false),
});

/**
 * Schéma pour mettre à jour un message
 */
export const messageUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  images: z.array(z.string()).optional(), // Accepter n'importe quelle string pour les images (peut être une URL ou un chemin)
  userId: z.string().min(1).optional(),
  userName: z.string().min(1).optional(),
  display_on_home: z.boolean().optional(),
});

/**
 * Types inférés depuis les schémas
 */
export type MessageCreateInput = z.infer<typeof messageCreateSchema>;
export type MessageUpdateInput = z.infer<typeof messageUpdateSchema>;

