-- ============================================
-- RÉACTIVER LE TRIGGER APRÈS LA MIGRATION
-- ============================================

-- Réactiver le trigger
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- Réactiver RLS (si désactivé)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Vérifier que tout est réactivé
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

