# 🔍 Debug : Erreur Migration Auth

## ❌ Erreur Persistante

L'erreur `unexpected_failure` (500) persiste même après avoir :
- ✅ Exécuté `migration-auth-complete.sql`
- ✅ Exécuté `fix-auth-migration.sql`
- ✅ Exécuté `fix-trigger-rls.sql`

## 🔍 Causes Possibles

### 1. Problème avec le Trigger

Le trigger `handle_new_user` peut échouer silencieusement et causer un rollback de la transaction.

**Solution** : Désactiver temporairement le trigger pendant la migration.

### 2. Contrainte Foreign Key

La contrainte `users_id_fkey` vers `auth.users(id)` peut causer un problème si l'ID n'existe pas encore au moment de l'insertion.

### 3. Problème avec RLS

Même avec `SECURITY DEFINER` et `set_config`, RLS peut bloquer.

## ✅ Solutions à Tester

### Solution 1 : Désactiver Temporairement le Trigger

```sql
-- Désactiver le trigger temporairement
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- Après la migration, réactiver :
-- ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
```

### Solution 2 : Désactiver Temporairement RLS

```sql
-- Désactiver RLS temporairement
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Migrer les utilisateurs avec npm run migrate:auth

-- Après la migration, réactiver :
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### Solution 3 : Créer les Utilisateurs Sans Trigger

1. Désactiver le trigger
2. Créer les utilisateurs dans Auth
3. Créer manuellement les profils dans `users`
4. Réactiver le trigger

### Solution 4 : Vérifier les Logs Supabase

Dans **Supabase Dashboard** → **Logs** → **Postgres Logs**, vérifier les erreurs exactes lors de la création d'un utilisateur.

## 📋 Scripts SQL de Dépannage

### Script 1 : Désactiver le Trigger

```sql
-- Désactiver le trigger
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;
```

### Script 2 : Désactiver RLS

```sql
-- Désactiver RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
```

### Script 3 : Vérifier l'État Actuel

```sql
-- Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Vérifier RLS
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'users';

-- Vérifier les politiques
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
AND schemaname = 'public';
```

## 🚀 Recommandation

**Approche progressive** :

1. Désactiver temporairement le trigger
2. Migrer les utilisateurs
3. Créer manuellement les profils si nécessaire
4. Réactiver le trigger

---

**Action immédiate** : Exécuter `supabase/disable-rls-temporarily.sql` puis réessayer la migration.

