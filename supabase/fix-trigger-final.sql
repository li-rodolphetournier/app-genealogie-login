-- ============================================
-- FIX FINAL : Modifier le trigger pour contourner RLS complètement
-- ============================================

-- Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Créer une nouvelle fonction qui contourne RLS en utilisant un contexte différent
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Utiliser un SET LOCAL pour désactiver RLS dans cette transaction
    EXECUTE 'SET LOCAL row_security = off';
    
    INSERT INTO public.users (id, email, login, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        login = EXCLUDED.login,
        status = EXCLUDED.status;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, loguer mais ne pas bloquer la création de l'utilisateur Auth
        RAISE WARNING 'Erreur lors de la création du profil utilisateur: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Vérifier que tout est bien configuré
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Vérifier la fonction
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig
FROM pg_proc
WHERE proname = 'handle_new_user';

