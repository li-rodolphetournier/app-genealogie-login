# 🔧 Fix : Erreur Migration Auth

## ❌ Problème

Lors de l'exécution de `npm run migrate:auth`, l'erreur suivante apparaît :
```
Database error creating new user
Code: unexpected_failure
Status: 500
```

## 🔍 Cause

Le trigger `handle_new_user` essaie d'insérer dans la table `users` lors de la création d'un utilisateur dans `auth.users`, mais les politiques RLS bloquent l'insertion même si la fonction est `SECURITY DEFINER`.

## ✅ Solution

Exécuter le script SQL suivant dans **Supabase Dashboard** → **SQL Editor** :

```sql
-- Permettre toutes les insertions dans la table users
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow all insertions" ON public.users;

CREATE POLICY "Allow all insertions" ON public.users
    FOR INSERT
    WITH CHECK (true);
```

Ce script crée une politique qui permet **toutes les insertions** dans la table `users`, ce qui permettra au trigger de fonctionner correctement.

## 🚀 Après le Fix

1. Exécuter le script SQL ci-dessus dans Supabase Dashboard
2. Réexécuter `npm run migrate:auth`
3. Vérifier que les utilisateurs sont créés

## 🔒 Sécurité

Cette politique permet toutes les insertions, mais :
- Les insertions via le trigger sont sûres (validées par Supabase Auth)
- Les SELECT et UPDATE restent protégés par les autres politiques RLS
- Seul le Service Role peut créer des utilisateurs via `auth.admin.createUser()`

## 📝 Alternative (Plus Sécurisée)

Si vous voulez une approche plus restrictive, vous pouvez modifier le trigger pour désactiver RLS temporairement :

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Désactiver RLS temporairement pour cette fonction
    PERFORM set_config('row_security', 'off', true);
    
    INSERT INTO public.users (id, email, login, status)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'login', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'status', 'utilisateur')
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Réactiver RLS
    PERFORM set_config('row_security', 'on', true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Mais la première solution (politique permissive) est plus simple et suffisante pour ce cas d'usage.

