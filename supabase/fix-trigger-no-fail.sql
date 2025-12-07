-- ============================================
-- FIX : Modifier le trigger pour ne PAS bloquer en cas d'erreur
-- ============================================
-- 
-- On ne peut pas désactiver le trigger sur auth.users (permissions)
-- Mais on peut modifier la fonction pour qu'elle ne fasse pas échouer
-- la création de l'utilisateur en cas d'erreur
--

-- Modifier la fonction pour qu'elle ignore les erreurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Essayer d'insérer, mais ne pas faire échouer si ça ne marche pas
    BEGIN
        INSERT INTO public.users (id, email, login, status)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
            COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
        )
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            -- Logger l'erreur mais ne pas bloquer la création de l'utilisateur Auth
            RAISE WARNING 'Erreur lors de la création du profil utilisateur pour %: %', NEW.email, SQLERRM;
            -- Continuer sans faire échouer
    END;
    
    RETURN NEW;
END;
$$;

-- Vérifier que la fonction est bien modifiée
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    prosrc
FROM pg_proc
WHERE proname = 'handle_new_user';

