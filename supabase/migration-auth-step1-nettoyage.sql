-- ============================================
-- ÉTAPE 1 : NETTOYAGE - À exécuter EN PREMIER
-- ============================================
-- 
-- Ce script supprime toutes les politiques RLS avant la migration
-- À exécuter AVANT le script de migration principal
-- ============================================

-- Désactiver RLS
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can be created by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can be updated by themselves or admins" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Public write access" ON public.users;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Nettoyage terminé. Vous pouvez maintenant exécuter le script de migration.';
END $$;

