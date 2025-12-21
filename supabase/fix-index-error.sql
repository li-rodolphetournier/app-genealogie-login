-- ============================================
-- CORRECTION: Supprimer l'index problématique
-- ============================================
-- Ce script supprime l'index qui cause l'erreur IMMUTABLE
-- et le remplace par un index valide

-- Supprimer l'index problématique s'il existe
DROP INDEX IF EXISTS public.idx_genealogy_node_positions_recent;

-- Créer l'index corrigé (sans prédicat temporel)
CREATE INDEX IF NOT EXISTS idx_genealogy_node_positions_updated_at 
    ON public.genealogy_node_positions(updated_at DESC);

