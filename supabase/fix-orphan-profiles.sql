-- ============================================
-- CORRECTION DES PROFILS ORPHELINS
-- ============================================
-- ⚠️ ATTENTION : Exécuter d'abord identify-orphan-profiles.sql
-- ⚠️ Faire une sauvegarde avant d'exécuter ce script
-- ============================================

-- ============================================
-- OPTION 1 : CRÉER DES COMPTES AUTH POUR LES PROFILS ORPHELINS
-- ============================================
-- ⚠️ Cette option nécessite de créer les comptes manuellement via Supabase Dashboard
-- ou via l'API Supabase Auth
-- 
-- Pour chaque profil orphelin, tu dois :
-- 1. Aller dans Supabase Dashboard → Authentication → Users → Add User
-- 2. Créer un utilisateur avec :
--    - Email : celui du profil (u.email)
--    - Password : générer un mot de passe temporaire
--    - UUID : utiliser exactement u.id du profil orphelin
--
-- OU utiliser l'API Supabase Admin pour créer les comptes :
-- (Voir documentation/GUIDE_CREATION_COMPTES_AUTH.md)

-- ============================================
-- OPTION 2 : SUPPRIMER LES PROFILS ORPHELINS NON UTILISÉS
-- ============================================
-- ⚠️ DANGER : Supprime les profils qui ne sont référencés nulle part
-- Décommenter seulement si tu es sûr

/*
-- Supprimer les profils orphelins qui ne sont utilisés nulle part
DELETE FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = u.id
)
AND NOT EXISTS (
    SELECT 1 FROM public.objects o WHERE o.utilisateur_id = u.id
)
AND NOT EXISTS (
    SELECT 1 FROM public.messages m WHERE m.user_id = u.id
);
*/

-- ============================================
-- OPTION 3 : RÉAFFECTER LES RÉFÉRENCES VERS UN UTILISATEUR SYSTÈME
-- ============================================
-- Si un profil orphelin est utilisé dans objects/messages,
-- réaffecter ces références vers un utilisateur système existant
-- 
-- ⚠️ DANGER : Modifie les données existantes
-- Décommenter et adapter les UUIDs selon tes besoins

/*
-- Trouver un utilisateur système (administrateur) pour réaffecter
-- Remplace 'SYSTEM_USER_UUID' par l'UUID d'un administrateur valide
DO $$
DECLARE
    system_user_id UUID := 'SYSTEM_USER_UUID'; -- ⚠️ À ADAPTER
    orphan_id UUID := 'ORPHAN_PROFILE_UUID'; -- ⚠️ À ADAPTER
BEGIN
    -- Réaffecter les objects
    UPDATE public.objects
    SET utilisateur_id = system_user_id
    WHERE utilisateur_id = orphan_id;
    
    -- Réaffecter les messages
    UPDATE public.messages
    SET user_id = system_user_id
    WHERE user_id = orphan_id;
    
    -- Supprimer le profil orphelin après réaffectation
    DELETE FROM public.users WHERE id = orphan_id;
END $$;
*/

-- ============================================
-- OPTION 4 : CRÉER UN COMPTE AUTH AVEC L'API (Script Node.js)
-- ============================================
-- Voir le fichier scripts/create-auth-for-orphans.ts
-- Ce script utilise l'API Supabase Admin pour créer les comptes auth

-- ============================================
-- VÉRIFICATION APRÈS CORRECTION
-- ============================================

SELECT 
    '✅ Vérification après correction' as etape,
    COUNT(*) FILTER (WHERE au.id IS NULL) as profils_orphelins_restants,
    COUNT(*) FILTER (WHERE au.id IS NOT NULL) as profils_synchronises
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id;

