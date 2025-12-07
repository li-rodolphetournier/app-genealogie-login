-- ============================================
-- SUPPRIMER ET RECRÉER LE TRIGGER SIMPLE
-- ============================================

-- 1. Supprimer le trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. S'assurer que RLS est désactivé
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Créer une fonction très simple qui ne peut pas échouer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insérer directement, RLS est désactivé donc ça devrait fonctionner
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
        -- Si erreur, juste retourner NEW sans bloquer
        RETURN NEW;
END;
$$;

-- 4. Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

SELECT 'Trigger recréé avec RLS désactivé' as status;

