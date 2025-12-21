/**
 * Cache pour les timezones PostgreSQL
 * Évite les requêtes coûteuses sur pg_timezone_names
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

let timezoneCache: string[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Récupère la liste des timezones depuis la vue matérialisée
 * Utilise un cache en mémoire pour éviter les requêtes répétées
 */
export async function getTimezoneNames(): Promise<string[]> {
  const now = Date.now();

  // Retourner le cache si valide
  if (timezoneCache && (now - cacheTimestamp) < CACHE_TTL) {
    return timezoneCache;
  }

  try {
    const supabase = await createServiceRoleClient();

    // Essayer d'abord la vue matérialisée (si elle existe)
    const { data: cachedData, error: cachedError } = await supabase
      .rpc('get_cached_timezones');

    if (!cachedError && cachedData && Array.isArray(cachedData)) {
      timezoneCache = cachedData;
      cacheTimestamp = now;
      return timezoneCache;
    }

    // Fallback: utiliser la vue matérialisée directement
    const { data, error } = await supabase
      .from('cached_timezone_names')
      .select('name')
      .order('name');

    if (error) {
      // Si la vue matérialisée n'existe pas, utiliser pg_timezone_names
      // (moins optimal mais fonctionnel)
      const { data: fallbackData, error: fallbackError } = await supabase
        .rpc('exec_sql', { 
          query: 'SELECT name FROM pg_timezone_names ORDER BY name' 
        });

      if (fallbackError) {
        console.warn('[timezone-cache] Erreur lors de la récupération des timezones:', fallbackError);
        return [];
      }

      timezoneCache = (fallbackData as { name: string }[]).map(row => row.name);
    } else {
      timezoneCache = (data || []).map(row => row.name);
    }

    cacheTimestamp = now;
    return timezoneCache;
  } catch (error) {
    console.error('[timezone-cache] Erreur inattendue:', error);
    return timezoneCache || [];
  }
}

/**
 * Invalide le cache (utile après un rafraîchissement de la vue matérialisée)
 */
export function invalidateTimezoneCache(): void {
  timezoneCache = null;
  cacheTimestamp = 0;
}

