-- ============================================
-- VÉRIFICATION DE SYNCHRONISATION
-- Entre auth.users et public.users
-- ============================================

-- ============================================
-- 1. VUE D'ENSEMBLE DES DEUX TABLES
-- ============================================

-- Nombre total d'utilisateurs dans auth.users
SELECT 
    'auth.users' as table_name,
    COUNT(*) as total_users
FROM auth.users;

-- Nombre total d'utilisateurs dans public.users
SELECT 
    'public.users' as table_name,
    COUNT(*) as total_users
FROM public.users;

-- ============================================
-- 2. UTILISATEURS DANS auth.users MAIS PAS DANS public.users
-- (Comptes auth sans profil)
-- ============================================

SELECT 
    '⚠️ Utilisateurs auth.users sans profil public.users' as probleme,
    au.id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    'PROFIL MANQUANT' as statut
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================
-- 3. UTILISATEURS DANS public.users MAIS PAS DANS auth.users
-- (Profils orphelins - problème critique)
-- ============================================

SELECT 
    '❌ Profils public.users sans compte auth.users' as probleme,
    u.id,
    u.login,
    u.email,
    u.status,
    u.created_at as profile_created_at,
    'COMPTE AUTH MANQUANT' as statut
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================
-- 4. INCOHÉRENCES D'EMAIL
-- (Email différent entre les deux tables)
-- ============================================

SELECT 
    '⚠️ Incohérence d''email entre auth.users et public.users' as probleme,
    au.id,
    au.email as auth_email,
    u.email as profile_email,
    u.login,
    u.status,
    'EMAIL DIFFERENT' as statut
FROM auth.users au
INNER JOIN public.users u ON u.id = au.id
WHERE au.email != u.email
ORDER BY au.created_at DESC;

-- ============================================
-- 5. UTILISATEURS SYNCHRONISÉS CORRECTEMENT
-- ============================================

SELECT 
    '✅ Utilisateurs synchronisés correctement' as statut,
    COUNT(*) as total_synchronises
FROM auth.users au
INNER JOIN public.users u ON u.id = au.id
WHERE au.email = u.email;

-- ============================================
-- 6. RÉSUMÉ COMPLET AVEC TOUS LES DÉTAILS
-- ============================================

SELECT 
    au.id,
    au.email as auth_email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    u.login,
    u.email as profile_email,
    u.status,
    u.description,
    u.created_at as profile_created_at,
    CASE 
        WHEN u.id IS NULL THEN '❌ Profil manquant'
        WHEN au.id IS NULL THEN '❌ Compte auth manquant'
        WHEN au.email != u.email THEN '⚠️ Email différent'
        ELSE '✅ Synchronisé'
    END as statut_sync
FROM auth.users au
FULL OUTER JOIN public.users u ON u.id = au.id
ORDER BY 
    CASE 
        WHEN u.id IS NULL THEN 1
        WHEN au.id IS NULL THEN 2
        WHEN au.email != u.email THEN 3
        ELSE 4
    END,
    COALESCE(au.created_at, u.created_at) DESC;

-- ============================================
-- 7. STATISTIQUES PAR STATUT
-- ============================================

SELECT 
    u.status,
    COUNT(*) as nombre_utilisateurs,
    COUNT(CASE WHEN au.id IS NOT NULL THEN 1 END) as avec_compte_auth,
    COUNT(CASE WHEN au.id IS NULL THEN 1 END) as sans_compte_auth
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
GROUP BY u.status
ORDER BY u.status;

