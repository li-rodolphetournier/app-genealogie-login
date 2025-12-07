-- ============================================
-- VÉRIFIER L'ÉTAT DE LA BASE DE DONNÉES
-- ============================================

-- 1. Vérifier si la table users existe
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 2. Vérifier la structure de la table users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'users';

-- 4. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 5. Vérifier RLS
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- 6. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';

