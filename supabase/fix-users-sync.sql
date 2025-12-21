-- ============================================
-- CORRECTION DE SYNCHRONISATION
-- Entre auth.users et public.users
-- ============================================
-- ⚠️ ATTENTION : Exécuter d'abord verify-users-sync.sql
-- ⚠️ Faire une sauvegarde avant d'exécuter ce script
-- ============================================

-- ============================================
-- 1. SUPPRIMER LES PROFILS ORPHELINS
-- (Profils sans compte auth.users)
-- ============================================
-- ⚠️ DANGER : Supprime les profils qui n'ont pas de compte auth
-- Décommenter seulement si tu es sûr de vouloir supprimer ces profils

/*
DELETE FROM public.users u
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = u.id
);
*/

-- ============================================
-- 2. CRÉER DES PROFILS POUR LES UTILISATEURS AUTH SANS PROFIL
-- ============================================
-- Crée automatiquement des profils pour les comptes auth qui n'ont pas de profil
-- Utilise l'email comme login par défaut

INSERT INTO public.users (id, login, email, status, created_at, updated_at)
SELECT 
    au.id,
    -- Utiliser la partie avant @ de l'email comme login
    SPLIT_PART(au.email, '@', 1) as login,
    au.email,
    'utilisateur' as status, -- Statut par défaut
    COALESCE(au.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CORRIGER LES INCOHÉRENCES D'EMAIL
-- (Mettre à jour public.users.email avec auth.users.email)
-- ============================================
-- L'email dans auth.users est la source de vérité

UPDATE public.users u
SET 
    email = au.email,
    updated_at = NOW()
FROM auth.users au
WHERE u.id = au.id 
    AND u.email != au.email;

-- ============================================
-- 4. VÉRIFIER LES CONTRAINTES D'UNICITÉ
-- ============================================
-- Vérifier s'il y a des doublons de login ou email dans public.users

-- Doublons de login
SELECT 
    '⚠️ Doublons de login dans public.users' as probleme,
    login,
    COUNT(*) as nombre,
    array_agg(id::text) as ids,
    array_agg(email) as emails
FROM public.users
GROUP BY login
HAVING COUNT(*) > 1;

-- Doublons d'email
SELECT 
    '⚠️ Doublons d''email dans public.users' as probleme,
    email,
    COUNT(*) as nombre,
    array_agg(id::text) as ids,
    array_agg(login) as logins
FROM public.users
GROUP BY email
HAVING COUNT(*) > 1;

-- ============================================
-- 5. NETTOYER LES DOUBLONS (si nécessaire)
-- ============================================
-- ⚠️ DANGER : Garde seulement le profil le plus ancien pour chaque login/email
-- Décommenter seulement si tu veux supprimer les doublons

/*
-- Supprimer les doublons de login (garder le plus ancien)
DELETE FROM public.users u1
WHERE u1.id IN (
    SELECT u2.id
    FROM public.users u2
    WHERE u2.login = u1.login
    AND u2.created_at > (
        SELECT MIN(u3.created_at)
        FROM public.users u3
        WHERE u3.login = u2.login
    )
);

-- Supprimer les doublons d'email (garder le plus ancien)
DELETE FROM public.users u1
WHERE u1.id IN (
    SELECT u2.id
    FROM public.users u2
    WHERE u2.email = u1.email
    AND u2.created_at > (
        SELECT MIN(u3.created_at)
        FROM public.users u3
        WHERE u3.email = u2.email
    )
);
*/

-- ============================================
-- 6. VÉRIFICATION FINALE
-- ============================================
-- Après les corrections, vérifier que tout est synchronisé

SELECT 
    '✅ Vérification finale' as etape,
    COUNT(*) FILTER (WHERE u.id IS NULL) as auth_sans_profil,
    COUNT(*) FILTER (WHERE au.id IS NULL) as profils_orphelins,
    COUNT(*) FILTER (WHERE au.id IS NOT NULL AND u.id IS NOT NULL AND au.email != u.email) as emails_differents,
    COUNT(*) FILTER (WHERE au.id IS NOT NULL AND u.id IS NOT NULL AND au.email = u.email) as synchronises
FROM auth.users au
FULL OUTER JOIN public.users u ON u.id = au.id;

