-- ============================================
-- FIX : Modifier le trigger pour désactiver RLS temporairement
-- ============================================

-- Le problème : RLS bloque les insertions même avec SECURITY DEFINER
-- Solution : Désactiver RLS temporairement dans la fonction

-- Modifier la fonction handle_new_user pour désactiver RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Désactiver RLS temporairement pour cette fonction
    PERFORM set_config('row_security', 'off', true);
    
    INSERT INTO public.users (id, email, login, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Réactiver RLS (optionnel, sera restauré automatiquement à la fin de la transaction)
    PERFORM set_config('row_security', 'on', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vérifier que le trigger est bien configuré
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

