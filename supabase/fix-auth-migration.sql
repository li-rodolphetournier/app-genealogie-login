-- ============================================
-- FIX : Permettre la création d'utilisateurs via Service Role
-- ============================================

-- Le problème : Le trigger handle_new_user essaie d'insérer dans users
-- mais RLS bloque l'insertion même avec SECURITY DEFINER

-- Solution 1 : Désactiver temporairement RLS pour les insertions par trigger
-- OU
-- Solution 2 : Modifier la politique pour permettre l'insertion

-- Supprimer l'ancienne politique qui pourrait bloquer
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow trigger insert" ON public.users;

-- Créer une politique qui permet TOUTES les insertions
-- (Le trigger handle_new_user sera utilisé par Supabase Auth lors de la création)
CREATE POLICY "Allow all insertions" ON public.users
    FOR INSERT
    WITH CHECK (true);

-- Vérifier les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';

