# 🔍 Explication de l'Erreur SQL

## ❌ Le Problème

L'erreur `syntax error at or near "IF"` se produit quand vous avez copié-collé plusieurs scripts SQL ensemble dans Supabase Dashboard.

### Cause

Il y avait un **SELECT incomplet** d'un autre fichier (`disable-trigger-for-migration.sql`) qui n'était pas fermé correctement avant le `DROP TRIGGER IF EXISTS`. PostgreSQL pensait que le `DROP` faisait partie du `SELECT` incomplet.

### Exemple du Problème

```sql
-- SELECT incomplet (manque des colonnes et FROM)
SELECT trigger_name, event_manipulation, -- PAS DE FROM ni de WHERE ni de ;

-- Ensuite, directement :
DROP TRIGGER IF EXISTS ... -- ❌ Erreur : PostgreSQL pense que IF fait partie du SELECT
```

## ✅ La Solution Proposée par l'IA de Supabase

L'IA suggère deux options :

### Option A : Compléter le SELECT (si vous voulez vérifier)

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
-- ⚠️ Ne pas oublier le point-virgule à la fin !
```

### Option B : Supprimer le SELECT (recommandé)

Supprimer complètement le bloc SELECT si vous n'en avez pas besoin.

## 🎯 Solution Finale

J'ai créé un **nouveau script SQL propre et complet** : `supabase/fix-trigger-complet-corrige.sql`

Ce script :
1. ✅ N'a **aucune erreur de syntaxe**
2. ✅ Supprime et recrée le trigger proprement
3. ✅ Désactive RLS temporairement
4. ✅ Crée une fonction qui ne bloque pas
5. ✅ Inclut des commentaires clairs

### Instructions

1. **Copier** le contenu de `supabase/fix-trigger-complet-corrige.sql`
2. **Coller** dans Supabase Dashboard → SQL Editor
3. **Exécuter** le script
4. **Relancer** `npm run migrate:auth`

### Après la Migration

Une fois la migration réussie, réactiver RLS :

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

---

**Astuce** : Ne jamais copier-coller plusieurs fichiers SQL ensemble. Exécutez-les un par un, ou utilisez un seul fichier complet.

