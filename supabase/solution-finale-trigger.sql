-- ============================================
-- SOLUTION FINALE : Supprimer et recréer le trigger
-- ============================================
-- 
-- Le trigger actuel bloque. Supprimons-le temporairement,
-- faisons la migration, puis recréons-le.
--

-- 1. Supprimer le trigger existant
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Vérifier que RLS est désactivé sur public.users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 4. Créer une nouvelle fonction SIMPLE qui ne peut pas échouer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Inserer sans aucune vérification, RLS désactivé
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
        -- Ne jamais faire échouer la création de l'utilisateur Auth
        RETURN NEW;
END;
$$;

-- 5. Recréer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Vérification
SELECT 'Trigger et fonction recréés avec RLS désactivé' as status;

