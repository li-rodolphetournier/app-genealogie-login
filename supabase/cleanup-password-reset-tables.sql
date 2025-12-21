-- ============================================
-- NETTOYAGE : Suppression des tables obsolètes
-- ============================================
-- Ce script supprime les tables et fonctions créées pour le système
-- personnalisé de réinitialisation de mot de passe (Resend)
-- qui a été supprimé pour revenir à Supabase uniquement
--
-- ⚠️ ATTENTION : Ce script est destructif
-- Exécutez-le uniquement si vous êtes sûr de vouloir supprimer ces tables
-- ============================================

-- ============================================
-- 1. SUPPRIMER LES POLITIQUES RLS
-- ============================================

-- Supprimer les politiques RLS sur password_reset_tokens si elles existent
DO $$
BEGIN
    -- Supprimer la politique "Password reset tokens are viewable by admins only"
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'password_reset_tokens'
        AND policyname = 'Password reset tokens are viewable by admins only'
    ) THEN
        DROP POLICY IF EXISTS "Password reset tokens are viewable by admins only" 
        ON public.password_reset_tokens;
        RAISE NOTICE 'Politique RLS supprimée : Password reset tokens are viewable by admins only';
    END IF;
END $$;

-- ============================================
-- 2. SUPPRIMER LES INDEX
-- ============================================

-- Supprimer les index sur password_reset_tokens si la table existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'password_reset_tokens') THEN
        DROP INDEX IF EXISTS idx_password_reset_tokens_token;
        DROP INDEX IF EXISTS idx_password_reset_tokens_user_id;
        DROP INDEX IF EXISTS idx_password_reset_tokens_user_email;
        DROP INDEX IF EXISTS idx_password_reset_tokens_expires_at;
        DROP INDEX IF EXISTS idx_password_reset_tokens_used;
        DROP INDEX IF EXISTS idx_password_reset_tokens_expires_used;
        RAISE NOTICE 'Index supprimés sur password_reset_tokens';
    END IF;
END $$;

-- ============================================
-- 3. SUPPRIMER LES FONCTIONS
-- ============================================

-- Supprimer la fonction de nettoyage automatique si elle existe
DROP FUNCTION IF EXISTS cleanup_expired_password_reset_tokens() CASCADE;

-- ============================================
-- 4. SUPPRIMER LES TABLES
-- ============================================

-- Supprimer la table password_reset_tokens si elle existe
DROP TABLE IF EXISTS public.password_reset_tokens CASCADE;

-- NOTE: La table password_reset_logs est CONSERVÉE car elle est utilisée
-- par le système Supabase pour journaliser les actions de réinitialisation
-- (voir src/lib/audit/password-reset-logger.ts)

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

-- Vérifier que les tables ont bien été supprimées
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Vérifier password_reset_tokens
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'password_reset_tokens'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE WARNING '⚠️ La table password_reset_tokens existe toujours !';
    ELSE
        RAISE NOTICE '✅ La table password_reset_tokens a été supprimée';
    END IF;
    
    -- NOTE: password_reset_logs est conservée (utilisée par Supabase)
    
    -- Vérifier la fonction
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'cleanup_expired_password_reset_tokens'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE WARNING '⚠️ La fonction cleanup_expired_password_reset_tokens existe toujours !';
    ELSE
        RAISE NOTICE '✅ La fonction cleanup_expired_password_reset_tokens a été supprimée (ou n''existait pas)';
    END IF;
END $$;

-- ============================================
-- RÉSUMÉ
-- ============================================
-- Ce script a supprimé :
-- ✅ Les politiques RLS sur password_reset_tokens
-- ✅ Les index sur password_reset_tokens
-- ✅ La fonction cleanup_expired_password_reset_tokens
-- ✅ La table password_reset_tokens
--
-- ⚠️ CONSERVÉ : La table password_reset_logs est conservée car elle est utilisée
--    par le système Supabase pour journaliser les actions de réinitialisation
--
-- Le système utilise maintenant uniquement Supabase pour la réinitialisation
-- de mot de passe via les routes :
-- - /api/auth/forgot-password
-- - /api/auth/reset-password

