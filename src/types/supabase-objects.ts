/**
 * Types pour les données brutes retournées par Supabase
 * Utilisés pour typer les réponses de la base de données
 */

import type { ObjectPhoto } from './objects';

/**
 * Type pour un objet retourné par Supabase avec ses relations
 */
export type SupabaseObject = {
  id: string;
  nom: string;
  type: string;
  status: 'publie' | 'brouillon';
  description: string | null;
  long_description: string | null;
  utilisateur_id: string | null;
  created_at: string;
  updated_at: string;
  object_photos?: SupabaseObjectPhoto[];
};

/**
 * Type pour une photo d'objet retournée par Supabase
 */
export type SupabaseObjectPhoto = {
  id: string;
  url: string;
  description: string[];
  display_order: number;
  object_id: string;
};

/**
 * Type pour un utilisateur retourné par Supabase (minimal)
 */
export type SupabaseUser = {
  id: string;
  login: string;
  email?: string;
};

