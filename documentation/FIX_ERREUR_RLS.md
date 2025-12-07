# 🔧 Correction de l'Erreur RLS

## ❌ Erreur Rencontrée

```
ERROR: 0A000: cannot alter type of a column used in a policy definition
DETAIL: policy "Users can view own profile" on table users depends on column "id"
```

## 🔍 Cause du Problème

Le script tentait de modifier la colonne `id` alors que des **politiques RLS** existaient déjà et utilisaient cette colonne. PostgreSQL empêche la modification d'une colonne si elle est référencée par des politiques.

## ✅ Solution

Création d'une **version corrigée du script** qui :

1. ✅ **Supprime d'abord** toutes les politiques RLS
2. ✅ **Désactive RLS** temporairement
3. ✅ **Modifie** ensuite la structure de la table
4. ✅ **Réactive RLS** et **recrée** les politiques

## 📋 Fichiers Créés

### 1. **`supabase/migration-auth-complete-v2.sql`** ✅
   - Version corrigée du script
   - Supprime les politiques AVANT de modifier la table
   - **À utiliser** pour éviter l'erreur

### 2. **`supabase/migration-auth-complete-fixed.sql`** ✅
   - Version alternative corrigée

## 🚀 Comment Utiliser

### Option 1 : Utiliser la Version Corrigée (Recommandé)

1. **Ouvrir** `supabase/migration-auth-complete-v2.sql`
2. **Copier** tout le contenu
3. **Aller dans** Supabase Dashboard → SQL Editor
4. **Coller** et **Run**

### Option 2 : Supprimer les Politiques Manuellement

Si vous préférez le faire manuellement :

1. Dans **Supabase Dashboard** → **Authentication** → **Policies**
2. **Supprimer** toutes les politiques pour la table `users`
3. **Désactiver RLS** temporairement sur `users`
4. **Exécuter** ensuite le script de migration original
5. **Réactiver RLS** et recréer les politiques

## 📝 Script de Nettoyage Rapide

Si vous voulez nettoyer rapidement avant de relancer :

```sql
-- Désactiver RLS
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can be created by authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can be updated by themselves or admins" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Public read access" ON public.users;
DROP POLICY IF EXISTS "Public write access" ON public.users;
```

Puis exécuter le script de migration.

## ✅ Vérification

Après exécution du script corrigé, vérifier :

1. La table `users` existe et n'a **pas** de colonne `password_hash`
2. Les politiques RLS sont recréées
3. La structure est correcte

---

**Solution** : Utiliser `supabase/migration-auth-complete-v2.sql` qui corrige le problème !

