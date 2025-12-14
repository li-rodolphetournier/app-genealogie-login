/**
 * Utilitaires pour la gestion de l'historique
 * Centralise la logique commune pour l'enregistrement de l'historique
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { isMockUserId } from '@/lib/features/mock-auth';

type HistoryAction = 'created' | 'updated' | 'deleted';

type HistoryEntry<T = Record<string, unknown>> = {
  object_id?: string | null;
  person_id?: string | null;
  action: HistoryAction;
  updated_by?: string | null;
  updated_at: string;
  old_values?: T;
  new_values?: T;
  changed_fields?: string[];
};

/**
 * Détermine l'ID de l'utilisateur pour l'historique
 * Gère les cas des utilisateurs mock en cherchant un administrateur système
 */
export async function determineUpdatedBy(
  supabase: SupabaseClient,
  userId: string | undefined | null
): Promise<string | null> {
  if (!userId) {
    return null;
  }

  // Si l'utilisateur n'est pas un mock, utiliser son ID directement
  if (!isMockUserId(userId)) {
    return userId;
  }

  // Pour les mocks, essayer de trouver un utilisateur système (admin)
  const { data: systemUser } = await supabase
    .from('users')
    .select('id')
    .eq('status', 'administrateur')
    .limit(1)
    .maybeSingle();

  if (!systemUser?.id) {
    logger.warn('[history-helpers] Utilisateur mock détecté et aucun utilisateur système trouvé, updated_by sera NULL');
  }

  return systemUser?.id || null;
}

/**
 * Enregistre une entrée dans l'historique des objets
 */
export async function logObjectHistory(
  supabase: SupabaseClient,
  entry: HistoryEntry
): Promise<void> {
  try {
    const { error } = await supabase
      .from('objects_history')
      .insert(entry);

    if (error) {
      logger.error('[history-helpers] Erreur lors de l\'enregistrement dans objects_history:', error);
    }
  } catch (error) {
    logger.error('[history-helpers] Erreur inattendue lors de l\'enregistrement dans objects_history:', error);
  }
}

/**
 * Enregistre une entrée dans l'historique des positions généalogiques
 */
export async function logGenealogyHistory(
  supabase: SupabaseClient,
  entry: HistoryEntry & { x: number; y: number; person_id: string }
): Promise<void> {
  try {
    // Si l'action est 'deleted', essayer d'abord avec 'person_deleted'
    const actionToTry = entry.action === 'deleted' ? 'person_deleted' : entry.action;
    
    const { error: error1 } = await supabase
      .from('genealogy_node_positions_history')
      .insert({
        person_id: entry.person_id,
        x: entry.x,
        y: entry.y,
        updated_at: entry.updated_at,
        action: actionToTry,
        updated_by: entry.updated_by,
      });

    if (error1) {
      // Si l'erreur est due à la contrainte CHECK, essayer avec 'deleted'
      if (error1.message?.includes('check constraint') || error1.code === '23514') {
        logger.warn('[history-helpers] Action person_deleted non supportée, utilisation de deleted comme fallback');
        const { error: error2 } = await supabase
          .from('genealogy_node_positions_history')
          .insert({
            person_id: entry.person_id,
            x: entry.x,
            y: entry.y,
            updated_at: entry.updated_at,
            action: 'deleted',
            updated_by: entry.updated_by,
          });

        if (error2) {
          logger.error('[history-helpers] Erreur lors de l\'enregistrement dans genealogy_node_positions_history:', error2);
        }
      } else {
        logger.error('[history-helpers] Erreur lors de l\'enregistrement dans genealogy_node_positions_history:', error1);
      }
    }
  } catch (error) {
    logger.error('[history-helpers] Erreur inattendue lors de l\'enregistrement dans genealogy_node_positions_history:', error);
  }
}

/**
 * Détecte les champs modifiés entre deux objets
 */
export function detectChangedFields<T extends Record<string, unknown>>(
  oldData: T,
  newData: T,
  ignoredFields: string[] = ['created_at', 'updated_at', 'id']
): string[] {
  const changed: string[] = [];

  // Vérifier les champs modifiés ou ajoutés
  for (const key in newData) {
    if (ignoredFields.includes(key)) continue;

    if (oldData[key] !== newData[key]) {
      changed.push(key);
    }
  }

  // Vérifier les champs supprimés
  for (const key in oldData) {
    if (ignoredFields.includes(key)) continue;

    if (!(key in newData) && oldData[key] != null) {
      changed.push(key);
    }
  }

  return changed;
}

