-- ============================================
-- VÉRIFIER L'ÉTAT DU TRIGGER
-- ============================================

-- 1. Vérifier si le trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
ORDER BY trigger_name;

-- 2. Vérifier la fonction du trigger
SELECT 
    proname as function_name,
    prosecdef as security_definer,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Vérifier RLS sur public.users
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'users';

