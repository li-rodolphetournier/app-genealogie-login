-- ============================================
-- VÉRIFICATION DE LA CRÉATION D'UTILISATEUR
-- Vérifie qu'un utilisateur est bien créé dans les deux tables
-- ============================================

-- ============================================
-- 1. VÉRIFIER LE TRIGGER
-- ============================================
-- Le trigger devrait créer automatiquement un profil dans public.users
-- quand un utilisateur est créé dans auth.users

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
ORDER BY trigger_name;

-- ============================================
-- 2. VÉRIFIER LA FONCTION DU TRIGGER
-- ============================================

SELECT 
    proname as function_name,
    prosecdef as security_definer,
    proconfig,
    prosrc as function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- ============================================
-- 3. TEST : Vérifier un utilisateur spécifique
-- ============================================
-- Remplace 'USER_EMAIL' par l'email d'un utilisateur récemment créé

/*
SELECT 
    'auth.users' as table_source,
    au.id,
    au.email,
    au.created_at,
    au.email_confirmed_at,
    au.last_sign_in_at
FROM auth.users au
WHERE au.email = 'USER_EMAIL';

SELECT 
    'public.users' as table_source,
    u.id,
    u.login,
    u.email,
    u.status,
    u.created_at,
    u.updated_at
FROM public.users u
WHERE u.email = 'USER_EMAIL';

-- Vérification de synchronisation
SELECT 
    CASE 
        WHEN au.id IS NULL THEN '❌ Pas dans auth.users'
        WHEN u.id IS NULL THEN '❌ Pas dans public.users'
        WHEN au.id != u.id THEN '⚠️ IDs différents'
        WHEN au.email != u.email THEN '⚠️ Emails différents'
        ELSE '✅ Synchronisé correctement'
    END as statut_sync,
    au.id as auth_id,
    u.id as profile_id,
    au.email as auth_email,
    u.email as profile_email,
    u.login,
    u.status
FROM auth.users au
FULL OUTER JOIN public.users u ON u.id = au.id
WHERE au.email = 'USER_EMAIL' OR u.email = 'USER_EMAIL';
*/

-- ============================================
-- 4. VÉRIFIER LES DERNIERS UTILISATEURS CRÉÉS
-- ============================================

-- Derniers utilisateurs dans auth.users
SELECT 
    'auth.users' as source,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Derniers utilisateurs dans public.users
SELECT 
    'public.users' as source,
    id,
    login,
    email,
    status,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- ============================================
-- 5. VÉRIFIER LES INCOHÉRENCES RÉCENTES
-- ============================================

-- Utilisateurs créés dans auth.users dans les dernières 24h sans profil
SELECT 
    '⚠️ Auth sans profil (24h)' as probleme,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
AND au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY au.created_at DESC;

-- Profils créés dans public.users dans les dernières 24h sans auth
SELECT 
    '⚠️ Profil sans auth (24h)' as probleme,
    u.id,
    u.login,
    u.email,
    u.status,
    u.created_at
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id IS NULL
AND u.created_at > NOW() - INTERVAL '24 hours'
ORDER BY u.created_at DESC;

-- ============================================
-- 6. STATISTIQUES DE SYNCHRONISATION
-- ============================================

SELECT 
    '📊 Statistiques de synchronisation' as type,
    COUNT(*) FILTER (WHERE au.id IS NOT NULL AND u.id IS NOT NULL) as synchronises,
    COUNT(*) FILTER (WHERE au.id IS NOT NULL AND u.id IS NULL) as auth_sans_profil,
    COUNT(*) FILTER (WHERE au.id IS NULL AND u.id IS NOT NULL) as profils_orphelins,
    COUNT(*) FILTER (WHERE au.id IS NOT NULL AND u.id IS NOT NULL AND au.email != u.email) as emails_differents
FROM auth.users au
FULL OUTER JOIN public.users u ON u.id = au.id;

