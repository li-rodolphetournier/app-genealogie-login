# 🔧 Correction de l'Erreur SQL - Politiques RLS

## ❌ Erreur Rencontrée

```
ERROR: 0A000: cannot alter type of a column used in a policy definition
DETAIL: policy "Users can view own profile" on table users depends on column "id"
```

## 🔍 Explication

PostgreSQL empêche de modifier le type d'une colonne si des **politiques RLS** utilisent cette colonne. Le script tentait de modifier le type de `id` alors que des politiques existaient.

## ✅ Solutions

J'ai créé **2 versions corrigées** du script :

### Solution 1 : Script Simplifié (Recommandé) ⭐

**Fichier** : `supabase/migration-auth-simple.sql`

- ✅ Supprime toutes les politiques RLS d'abord
- ✅ Ne modifie **PAS** le type de colonne
- ✅ Supprime seulement `password_hash`
- ✅ Évite les erreurs

### Solution 2 : Script Corrigé

**Fichier** : `supabase/migration-auth-complete-v2.sql`

- ✅ Version complète avec corrections
- ✅ Gère mieux les erreurs

## 🚀 Utilisation

### Méthode 1 : Script Simplifié (Plus Sûr)

1. **Ouvrir** `supabase/migration-auth-simple.sql`
2. **Copier** tout le contenu
3. **Supabase Dashboard** → **SQL Editor**
4. **Coller** et **Run**

### Méthode 2 : Nettoyage Manuel d'abord

Exécuter ce SQL d'abord pour nettoyer :

```sql
-- Désactiver RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques
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

-- Supprimer password_hash
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
```

Puis exécuter le reste du script.

## 🎯 Recommandation

**Utilisez `supabase/migration-auth-simple.sql`** - C'est la version la plus sûre.

---

**Tout est corrigé !** Utilisez le script simplifié pour éviter l'erreur.

