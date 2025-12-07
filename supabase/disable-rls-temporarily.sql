-- ============================================
-- SOLUTION ALTERNATIVE : Désactiver RLS temporairement
-- ============================================
-- 
-- Si le trigger ne fonctionne toujours pas, vous pouvez désactiver
-- temporairement RLS sur la table users pour la migration, puis
-- le réactiver après.
--
-- ATTENTION : Ne laissez JAMAIS RLS désactivé en production !
--

-- Désactiver RLS temporairement
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Après la migration, réexécuter :
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

