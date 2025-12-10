/**
 * Schémas de validation Zod pour la généalogie
 */

import { z } from 'zod';

/**
 * Schéma pour créer une personne
 */
export const personCreateSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  genre: z.enum(['homme', 'femme'] as const, {
    message: 'Le genre doit être homme ou femme'
  }),
  description: z.string().optional().default(''),
  mere: z.string().nullable().optional(),
  pere: z.string().nullable().optional(),
  ordreNaissance: z.number().int().min(1, 'L\'ordre de naissance doit être au moins 1').optional().default(1),
  dateNaissance: z.string().min(1, 'La date de naissance est requise'),
  dateDeces: z.string().nullable().optional(),
  image: z.string().url('URL d\'image invalide').nullable().optional().or(z.literal('')),
});

/**
 * Schéma pour mettre à jour une personne
 */
export const personUpdateSchema = z.object({
  nom: z.string().min(1).max(100).optional(),
  prenom: z.string().min(1).max(100).optional(),
  genre: z.enum(['homme', 'femme'] as const).optional(),
  description: z.string().optional().or(z.literal('')),  // Permet les chaînes vides
  mere: z.string().nullable().optional(),
  pere: z.string().nullable().optional(),
  ordreNaissance: z.number().int().positive().optional(),
  dateNaissance: z.string().min(1).optional(),
  dateDeces: z.string().nullable().optional(),
  image: z.string().url().nullable().optional().or(z.literal('')),
});

/**
 * Types inférés depuis les schémas
 */
export type PersonCreateInput = z.infer<typeof personCreateSchema>;
export type PersonUpdateInput = z.infer<typeof personUpdateSchema>;

