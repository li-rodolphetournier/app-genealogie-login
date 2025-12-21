-- ============================================
-- OPTIMISATIONS DES REQUÊTES COÛTEUSES
-- ============================================
-- Ce script optimise les requêtes identifiées comme coûteuses
-- par l'analyse de performance

-- ============================================
-- 1. OPTIMISATION: genealogy_node_positions
-- ============================================
-- La requête INSERT/UPDATE avec ON CONFLICT est appelée 205 fois
-- Optimisations: indexes, contraintes, et configuration

-- Index composite pour améliorer les performances d'upsert
CREATE INDEX IF NOT EXISTS idx_genealogy_node_positions_person_id_covering 
    ON public.genealogy_node_positions(person_id) 
    INCLUDE (x, y, updated_by, updated_at);

-- Index pour les requêtes triées par date de mise à jour
-- (sans prédicat temporel car NOW() n'est pas IMMUTABLE)
CREATE INDEX IF NOT EXISTS idx_genealogy_node_positions_updated_at 
    ON public.genealogy_node_positions(updated_at DESC);

-- Optimiser la contrainte UNIQUE (déjà présente mais on s'assure qu'elle est optimale)
-- La contrainte UNIQUE sur person_id crée automatiquement un index unique
-- Vérifier qu'il existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'genealogy_node_positions_person_id_key'
    ) THEN
        ALTER TABLE public.genealogy_node_positions 
        ADD CONSTRAINT genealogy_node_positions_person_id_key UNIQUE (person_id);
    END IF;
END $$;

-- ============================================
-- 2. OPTIMISATION: Requêtes système PostgreSQL
-- ============================================
-- Les requêtes sur pg_timezone_names et les métadonnées sont coûteuses
-- Solution: Créer une vue matérialisée pour pg_timezone_names

-- Vue matérialisée pour les timezones (mis à jour quotidiennement)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_timezone_names AS
SELECT name FROM pg_timezone_names
ORDER BY name;

-- Index sur la vue matérialisée
CREATE UNIQUE INDEX IF NOT EXISTS idx_cached_timezone_names_name 
    ON public.cached_timezone_names(name);

-- Fonction pour rafraîchir la vue matérialisée
CREATE OR REPLACE FUNCTION public.refresh_timezone_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.cached_timezone_names;
END;
$$;

-- Fonction RPC pour récupérer les timezones depuis la vue matérialisée
CREATE OR REPLACE FUNCTION public.get_cached_timezones()
RETURNS TABLE(name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT name FROM public.cached_timezone_names ORDER BY name;
$$;

-- Rafraîchir automatiquement tous les jours à 3h du matin
-- (nécessite pg_cron extension - à activer si disponible)
-- SELECT cron.schedule('refresh-timezone-cache', '0 3 * * *', 'SELECT public.refresh_timezone_cache()');

-- ============================================
-- 3. OPTIMISATION: Sessions et Refresh Tokens
-- ============================================
-- Ces tables sont très fréquemment accédées (310 et 436 appels)
-- Optimisations: indexes et configuration

-- Index pour les sessions (si pas déjà présents)
CREATE INDEX IF NOT EXISTS idx_sessions_user_id_created 
    ON auth.sessions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_not_after 
    ON auth.sessions(not_after) 
    WHERE not_after IS NOT NULL;

-- Index pour refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_session_id 
    ON auth.refresh_tokens(session_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id_created 
    ON auth.refresh_tokens(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked 
    ON auth.refresh_tokens(revoked) 
    WHERE revoked = false;

-- ============================================
-- 4. OPTIMISATION: Configuration PostgreSQL
-- ============================================
-- Améliorer les paramètres pour réduire les requêtes coûteuses

-- Augmenter shared_buffers pour améliorer le cache hit rate
-- (À ajuster selon la RAM disponible - typiquement 25% de la RAM)
-- ALTER SYSTEM SET shared_buffers = '256MB'; -- Exemple, à adapter

-- Augmenter work_mem pour les requêtes complexes
-- ALTER SYSTEM SET work_mem = '16MB'; -- Exemple, à adapter

-- Optimiser effective_cache_size
-- ALTER SYSTEM SET effective_cache_size = '1GB'; -- Exemple, à adapter

-- ============================================
-- 5. STATISTIQUES ET ANALYSE
-- ============================================
-- Mettre à jour les statistiques pour améliorer le planificateur

ANALYZE public.genealogy_node_positions;
ANALYZE public.persons;
ANALYZE public.users;
ANALYZE public.objects;
ANALYZE public.messages;

-- ============================================
-- 6. VACUUM ET MAINTENANCE
-- ============================================
-- Nettoyer les tables pour améliorer les performances

VACUUM ANALYZE public.genealogy_node_positions;
VACUUM ANALYZE public.genealogy_node_positions_history;

-- ============================================
-- 7. COMMENTAIRES ET DOCUMENTATION
-- ============================================

COMMENT ON MATERIALIZED VIEW public.cached_timezone_names IS 
    'Cache des noms de timezones pour éviter les requêtes coûteuses sur pg_timezone_names';

COMMENT ON INDEX idx_genealogy_node_positions_person_id_covering IS 
    'Index couvrant pour optimiser les requêtes SELECT sur genealogy_node_positions';

-- ============================================
-- NOTES D'UTILISATION
-- ============================================
-- 
-- Pour utiliser la vue matérialisée au lieu de pg_timezone_names:
--   SELECT name FROM public.cached_timezone_names;
-- 
-- Pour rafraîchir manuellement:
--   SELECT public.refresh_timezone_cache();
--
-- Pour activer pg_cron (si disponible):
--   CREATE EXTENSION IF NOT EXISTS pg_cron;
--   SELECT cron.schedule('refresh-timezone-cache', '0 3 * * *', 'SELECT public.refresh_timezone_cache()');
--
-- Pour vérifier les paramètres PostgreSQL:
--   SHOW shared_buffers;
--   SHOW work_mem;
--   SHOW effective_cache_size;
--
-- Pour surveiller les performances après optimisation:
--   SELECT * FROM pg_stat_user_tables WHERE schemaname = 'public';
--   SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';

