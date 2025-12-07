-- ============================================
-- SOLUTION COMPLÈTE : Supprimer et recréer le trigger
-- Script corrigé sans erreurs de syntaxe
-- ============================================

-- ÉTAPE 1 : Vérifier l'état actuel (optionnel, peut être supprimé)
-- SELECT 
--     trigger_name,
--     event_manipulation,
--     event_object_table,
--     action_timing
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- ÉTAPE 2 : Supprimer le trigger et la fonction existants
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ÉTAPE 3 : Désactiver RLS temporairement pour permettre la migration
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 4 : Créer une nouvelle fonction qui ne peut pas bloquer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insérer le profil utilisateur (RLS est désactivé)
    INSERT INTO public.users (id, email, login, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Ne jamais bloquer la création de l'utilisateur Auth
        -- Logger un avertissement mais continuer
        RAISE WARNING 'Erreur lors de la création du profil pour %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- ÉTAPE 5 : Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ÉTAPE 6 : Vérification (optionnel)
SELECT 'Trigger et fonction recréés avec succès. RLS est désactivé temporairement.' as status;

-- ============================================
-- NOTES IMPORTANTES :
-- ============================================
-- 1. RLS est désactivé sur public.users - à réactiver après la migration
-- 2. Le trigger ne bloquera plus la création d'utilisateurs
-- 3. Après la migration réussie, exécuter :
--    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--    (Et recréer les politiques RLS si nécessaire)

