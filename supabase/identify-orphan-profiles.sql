-- ============================================
-- IDENTIFICATION DES PROFILS ORPHELINS
-- Profils dans public.users sans compte auth.users
-- ============================================

-- Détails complets des profils orphelins
SELECT 
    '❌ PROFIL ORPHELIN' as statut,
    u.id,
    u.login,
    u.email,
    u.status,
    u.description,
    u.created_at as profile_created_at,
    u.updated_at as profile_updated_at,
    '⚠️ Pas de compte auth.users correspondant' as probleme
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
WHERE au.id IS NULL
ORDER BY 
    CASE u.status
        WHEN 'administrateur' THEN 1
        WHEN 'redacteur' THEN 2
        WHEN 'utilisateur' THEN 3
    END,
    u.created_at DESC;

-- ============================================
-- VÉRIFIER SI CES PROFILS SONT UTILISÉS AILLEURS
-- ============================================

-- Profils orphelins utilisés dans objects
SELECT 
    '📦 Utilisé dans objects' as reference,
    u.id,
    u.login,
    u.status,
    COUNT(o.id) as nombre_objects
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
LEFT JOIN public.objects o ON o.utilisateur_id = u.id
WHERE au.id IS NULL
GROUP BY u.id, u.login, u.status
HAVING COUNT(o.id) > 0
ORDER BY nombre_objects DESC;

-- Profils orphelins utilisés dans messages
SELECT 
    '💬 Utilisé dans messages' as reference,
    u.id,
    u.login,
    u.status,
    COUNT(m.id) as nombre_messages
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
LEFT JOIN public.messages m ON m.user_id = u.id
WHERE au.id IS NULL
GROUP BY u.id, u.login, u.status
HAVING COUNT(m.id) > 0
ORDER BY nombre_messages DESC;

-- ============================================
-- RÉSUMÉ PAR STATUT
-- ============================================

SELECT 
    u.status,
    COUNT(*) as profils_orphelins,
    COUNT(DISTINCT o.id) as objets_associes,
    COUNT(DISTINCT m.id) as messages_associes
FROM public.users u
LEFT JOIN auth.users au ON au.id = u.id
LEFT JOIN public.objects o ON o.utilisateur_id = u.id
LEFT JOIN public.messages m ON m.user_id = u.id
WHERE au.id IS NULL
GROUP BY u.status
ORDER BY 
    CASE u.status
        WHEN 'administrateur' THEN 1
        WHEN 'redacteur' THEN 2
        WHEN 'utilisateur' THEN 3
    END;

