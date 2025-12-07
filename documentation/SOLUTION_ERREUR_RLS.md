# 🔧 Solution : Erreur de Migration RLS

## ❌ Erreur Rencontrée

```
ERROR: 0A000: cannot alter type of a column used in a policy definition
DETAIL: policy "Users can view own profile" on table users depends on column "id"
```

## 🔍 Cause

Le script tentait de **modifier le type de la colonne `id`** alors que des **politiques RLS** existaient déjà et utilisaient cette colonne. PostgreSQL empêche cette opération pour maintenir l'intégrité.

## ✅ Solution

J'ai créé un **script simplifié** qui évite de modifier le type de colonne :

### Fichier : `supabase/migration-auth-simple.sql`

Ce script :
1. ✅ **Supprime toutes les politiques RLS** d'abord
2. ✅ **Désactive RLS** temporairement
3. ✅ **Supprime uniquement** `password_hash` (pas de modification de type)
4. ✅ **Crée la table** si elle n'existe pas
5. ✅ **Ajoute la foreign key** si possible (sans modifier le type)
6. ✅ **Recrée les politiques** RLS

## 🚀 Instructions

### Option 1 : Script Simplifié (Recommandé)

1. **Ouvrir** `supabase/migration-auth-simple.sql`
2. **Copier** tout le contenu
3. **Aller dans** Supabase Dashboard → SQL Editor
4. **Coller** et **Run**

### Option 2 : Nettoyage Manuel Puis Script Original

Si vous préférez, nettoyer d'abord manuellement :

```sql
-- 1. Désactiver RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer toutes les politiques
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can be created by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can be updated by themselves or admins" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Public write access" ON public.users;

-- 3. Supprimer password_hash
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
```

Puis exécuter le reste du script de migration.

## 📋 Différences

### Script Original
- ❌ Tentait de modifier le type de la colonne `id`
- ❌ Causait une erreur avec les politiques RLS

### Script Simplifié
- ✅ Ne modifie pas le type de colonne
- ✅ Supprime seulement `password_hash`
- ✅ Ajoute la foreign key si possible
- ✅ Évite les erreurs de modification de type

## 🎯 Recommandation

**Utilisez `supabase/migration-auth-simple.sql`** - C'est la version la plus sûre qui évite les problèmes de modification de type de colonne.

---

**Solution** : Utiliser le script simplifié qui évite de modifier le type de colonne.

