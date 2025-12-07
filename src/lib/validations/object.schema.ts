/**
 * Schémas de validation Zod pour les objets
 */

import { z } from 'zod';

/**
 * Schéma pour une photo d'objet
 */
export const objectPhotoSchema = z.object({
  id: z.string().optional(),
  url: z.string().url('URL d\'image invalide'),
  description: z.array(z.string()),
  display_order: z.number().int().nonnegative().optional(),
});

/**
 * Schéma pour créer un objet
 */
export const objectCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  type: z.string().min(1, 'Le type est requis').max(100, 'Le type ne peut pas dépasser 100 caractères'),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  status: z.enum(['publie', 'brouillon'], {
    errorMap: () => ({ message: 'Le statut doit être publie ou brouillon' })
  }).default('brouillon'),
  utilisateur: z.string().min(1, 'L\'utilisateur est requis'),
  utilisateur_id: z.string().optional(),
  photos: z.array(objectPhotoSchema.omit({ id: true })).optional(),
});

/**
 * Schéma pour mettre à jour un objet
 */
export const objectUpdateSchema = z.object({
  nom: z.string().min(1).max(200).optional(),
  type: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  status: z.enum(['publie', 'brouillon']).optional(),
  utilisateur: z.string().min(1).optional(),
  utilisateur_id: z.string().optional(),
  photos: z.array(objectPhotoSchema).optional(),
});

/**
 * Types inférés depuis les schémas
 */
export type ObjectCreateInput = z.infer<typeof objectCreateSchema>;
export type ObjectUpdateInput = z.infer<typeof objectUpdateSchema>;
export type ObjectPhotoInput = z.infer<typeof objectPhotoSchema>;

